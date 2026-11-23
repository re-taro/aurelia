import { bundledLanguages } from 'shiki';

import type { ExtractedLines, GitHubPermalink, GitHubPermalinkSnippet, LineRange } from './definitions';

const GITHUB_HOSTS = new Set(['github.com', 'www.github.com']);

const RAW_CONTENT_ORIGIN = 'https://raw.githubusercontent.com';

const LINE_FRAGMENT_PATTERN = /^L(?<first>\d+)(?:C\d+)?(?:-L(?<second>\d+)(?:C\d+)?)?$/u;

const parseLineFragment = (hash: string): LineRange | null => {
	const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
	const matched = LINE_FRAGMENT_PATTERN.exec(fragment);
	const firstStr = matched?.groups?.['first'];
	const secondStr = matched?.groups?.['second'];
	if (matched == null || firstStr == null) {
		return null;
	}

	const first = Number(firstStr);
	const second = secondStr == null ? first : Number(secondStr);
	if (first < 1 || second < 1) {
		return null;
	}

	return first <= second ? { start: first, end: second } : { start: second, end: first };
};

export const parseGitHubPermalink = (input: string): GitHubPermalink | null => {
	try {
		const url = new URL(input);

		if (url.protocol !== 'https:' || !GITHUB_HOSTS.has(url.hostname)) {
			return null;
		}

		const segments = url.pathname.split('/').filter((segment) => segment !== '');
		const [owner, repo, kind, ref, ...pathSegments] = segments;
		if (owner == null || repo == null || kind !== 'blob' || ref == null || pathSegments.length === 0) {
			return null;
		}

		const path = pathSegments.map((segment) => decodeURIComponent(segment)).join('/');

		return {
			owner,
			repo,
			ref,
			path,
			lines: parseLineFragment(url.hash),
		};
	} catch {
		return null;
	}
};

const encodePath = (path: string): string =>
	path
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/');

export const buildRawContentURL = ({ owner, repo, ref, path }: GitHubPermalink): string =>
	`${RAW_CONTENT_ORIGIN}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(ref)}/${encodePath(path)}`;

export const buildPermalinkURL = ({ owner, repo, ref, path }: GitHubPermalink, lines: LineRange | null): string => {
	const base = `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/blob/${encodeURIComponent(ref)}/${encodePath(path)}`;
	if (lines == null) {
		return base;
	}
	return lines.start === lines.end ? `${base}#L${lines.start}` : `${base}#L${lines.start}-L${lines.end}`;
};

export const extractLines = (content: string, lines: LineRange | null): ExtractedLines => {
	const allLines = content.split(/\r?\n/u);
	if (allLines.length > 1 && allLines.at(-1) === '') {
		allLines.pop();
	}
	const totalLines = allLines.length;

	if (lines == null) {
		return { code: allLines.join('\n'), start: 1, end: totalLines, totalLines };
	}

	const start = Math.min(Math.max(lines.start, 1), totalLines);
	const end = Math.min(Math.max(lines.end, start), totalLines);

	return {
		code: allLines.slice(start - 1, end).join('\n'),
		start,
		end,
		totalLines,
	};
};

const PLAIN_TEXT_LANGUAGE = 'txt';

const FILENAME_LANGUAGE_MAP: Record<string, string> = {
	dockerfile: 'docker',
	containerfile: 'docker',
	makefile: 'makefile',
	gnumakefile: 'makefile',
	'.bashrc': 'bash',
	'.zshrc': 'zsh',
	'.gitignore': 'gitignore',
	'.npmrc': 'ini',
	'.editorconfig': 'ini',
	'.env': 'dotenv',
};

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
	h: 'c',
	hpp: 'cpp',
	cc: 'cpp',
	cxx: 'cpp',
	m: 'objective-c',
	mm: 'objective-cpp',
	ex: 'elixir',
	exs: 'elixir',
	ml: 'ocaml',
	mli: 'ocaml',
	pl: 'perl',
	pm: 'perl',
	fsx: 'fsharp',
	cljs: 'clojure',
	scm: 'scheme',
	el: 'lisp',
	sol: 'solidity',
	gradle: 'groovy',
	svg: 'xml',
	plist: 'xml',
	conf: 'ini',
	cfg: 'ini',
};

const isBundledLanguage = (id: string): boolean => Object.hasOwn(bundledLanguages, id);

export const resolveLanguage = (path: string): string => {
	const filename = path.split('/').at(-1)?.toLowerCase() ?? '';
	const byFilename = FILENAME_LANGUAGE_MAP[filename];
	if (byFilename != null) {
		return byFilename;
	}

	const dotIndex = filename.lastIndexOf('.');
	if (dotIndex <= 0) {
		return PLAIN_TEXT_LANGUAGE;
	}

	const extension = filename.slice(dotIndex + 1);
	if (isBundledLanguage(extension)) {
		return extension;
	}

	return EXTENSION_LANGUAGE_MAP[extension] ?? PLAIN_TEXT_LANGUAGE;
};

type Fetcher = typeof fetch;

const rawContentCache = new Map<string, Promise<string>>();

const fetchRawContent = (rawURL: string, fetcher: Fetcher): Promise<string> => {
	const cached = rawContentCache.get(rawURL);
	if (cached != null) {
		return cached;
	}

	const promise = (async (): Promise<string> => {
		try {
			const response = await fetcher(rawURL, {
				headers: { 'User-Agent': 'aurelia (https://blog.re-taro.dev)' },
			});
			if (!response.ok) {
				throw new Error(`Failed to fetch GitHub content: ${response.status} ${response.statusText} (url: ${rawURL})`);
			}
			return await response.text();
		} catch (error) {
			rawContentCache.delete(rawURL);
			throw error;
		}
	})();
	rawContentCache.set(rawURL, promise);

	return promise;
};

export const fetchGitHubPermalink = async (url: string, fetcher: Fetcher = fetch): Promise<GitHubPermalinkSnippet> => {
	const permalink = parseGitHubPermalink(url);
	if (permalink == null) {
		throw new Error(`Not a GitHub permalink: ${url}`);
	}

	const content = await fetchRawContent(buildRawContentURL(permalink), fetcher);
	const extracted = extractLines(content, permalink.lines);

	return {
		owner: permalink.owner,
		repo: permalink.repo,
		ref: permalink.ref,
		path: permalink.path,
		url: buildPermalinkURL(permalink, permalink.lines == null ? null : { start: extracted.start, end: extracted.end }),
		startLine: extracted.start,
		endLine: extracted.end,
		totalLines: extracted.totalLines,
		lang: resolveLanguage(permalink.path),
		code: extracted.code,
	};
};
