import { describe, expect, test, vi, type Mock } from 'vitest';

import {
	buildPermalinkURL,
	buildRawContentURL,
	extractLines,
	fetchGitHubPermalink,
	parseGitHubPermalink,
	resolveLanguage,
} from './services';

const createFetcher = (body: string, init?: ResponseInit): Mock<typeof fetch> =>
	vi.fn<typeof fetch>(() => Promise.resolve(new Response(body, init)));

describe('services', () => {
	describe('parseGitHubPermalink', () => {
		test('blob permalink から owner / repo / ref / path を抽出する', () => {
			const result = parseGitHubPermalink(
				'https://github.com/facebook/react/blob/d77dd31a329df55a051800fc76668af8da8332b4/compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts',
			);

			expect(result).toStrictEqual({
				owner: 'facebook',
				repo: 'react',
				ref: 'd77dd31a329df55a051800fc76668af8da8332b4',
				path: 'compiler/packages/babel-plugin-react-compiler/src/Entrypoint/Options.ts',
				lines: null,
			});
		});

		test('#L{start}-L{end} を行範囲として抽出する', () => {
			const result = parseGitHubPermalink('https://github.com/re-taro/aurelia/blob/main/src/index.ts#L116-L132');

			expect(result?.lines).toStrictEqual({ start: 116, end: 132 });
		});

		test('#L{line} 単独指定は start と end が同じ行になる', () => {
			const result = parseGitHubPermalink('https://github.com/re-taro/aurelia/blob/main/src/index.ts#L10');

			expect(result?.lines).toStrictEqual({ start: 10, end: 10 });
		});

		test('列指定 (#L10C5-L20C7) は列を無視して行だけ抽出する', () => {
			const result = parseGitHubPermalink('https://github.com/re-taro/aurelia/blob/main/src/index.ts#L10C5-L20C7');

			expect(result?.lines).toStrictEqual({ start: 10, end: 20 });
		});

		test('start > end の場合は入れ替える', () => {
			const result = parseGitHubPermalink('https://github.com/re-taro/aurelia/blob/main/src/index.ts#L20-L10');

			expect(result?.lines).toStrictEqual({ start: 10, end: 20 });
		});

		test('行番号として解釈できないフラグメントは無視する', () => {
			const result = parseGitHubPermalink('https://github.com/re-taro/aurelia/blob/main/README.md#usage');

			expect(result?.lines).toBeNull();
		});

		test('URL エンコードされたパスはデコードする', () => {
			const result = parseGitHubPermalink(
				'https://github.com/re-taro/aurelia/blob/main/docs/%E8%A8%AD%E8%A8%88/foo%20bar.md',
			);

			expect(result?.path).toBe('docs/設計/foo bar.md');
		});

		test('www.github.com も受け付ける', () => {
			const result = parseGitHubPermalink('https://www.github.com/re-taro/aurelia/blob/main/src/index.ts');

			expect(result?.owner).toBe('re-taro');
		});

		test.each([
			['GitHub 以外のホスト', 'https://gitlab.com/re-taro/aurelia/blob/main/src/index.ts'],
			['raw.githubusercontent.com', 'https://raw.githubusercontent.com/re-taro/aurelia/main/src/index.ts'],
			['http スキーム', 'http://github.com/re-taro/aurelia/blob/main/src/index.ts'],
			['blob 以外 (tree)', 'https://github.com/re-taro/aurelia/tree/main/src'],
			['blob 以外 (blame)', 'https://github.com/re-taro/aurelia/blame/main/src/index.ts'],
			['パスが無い', 'https://github.com/re-taro/aurelia/blob/main'],
			['リポジトリトップ', 'https://github.com/re-taro/aurelia'],
			['URL として不正', 'not a url'],
		])('%s は null を返す', (_, url) => {
			expect(parseGitHubPermalink(url)).toBeNull();
		});
	});

	describe('buildRawContentURL', () => {
		test('raw.githubusercontent.com の URL を組み立てる', () => {
			const result = buildRawContentURL({
				owner: 're-taro',
				repo: 'aurelia',
				ref: 'main',
				path: 'src/index.ts',
				lines: null,
			});

			expect(result).toBe('https://raw.githubusercontent.com/re-taro/aurelia/main/src/index.ts');
		});

		test('パスの各セグメントを URL エンコードする', () => {
			const result = buildRawContentURL({
				owner: 're-taro',
				repo: 'aurelia',
				ref: 'main',
				path: 'docs/設計/foo bar.md',
				lines: null,
			});

			expect(result).toBe(
				'https://raw.githubusercontent.com/re-taro/aurelia/main/docs/%E8%A8%AD%E8%A8%88/foo%20bar.md',
			);
		});
	});

	describe('buildPermalinkURL', () => {
		const permalink = {
			owner: 're-taro',
			repo: 'aurelia',
			ref: 'abc123',
			path: 'src/index.ts',
			lines: null,
		};

		test('行範囲が無い場合はフラグメントを付けない', () => {
			expect(buildPermalinkURL(permalink, null)).toBe('https://github.com/re-taro/aurelia/blob/abc123/src/index.ts');
		});

		test('行範囲がある場合は #L{start}-L{end} を付ける', () => {
			expect(buildPermalinkURL(permalink, { start: 3, end: 8 })).toBe(
				'https://github.com/re-taro/aurelia/blob/abc123/src/index.ts#L3-L8',
			);
		});

		test('1 行の場合は #L{line} にする', () => {
			expect(buildPermalinkURL(permalink, { start: 3, end: 3 })).toBe(
				'https://github.com/re-taro/aurelia/blob/abc123/src/index.ts#L3',
			);
		});
	});

	describe('extractLines', () => {
		const content = 'line1\nline2\nline3\nline4\nline5\n';

		test('行範囲が null の場合はファイル全体を返す', () => {
			const result = extractLines(content, null);

			expect(result).toStrictEqual({
				code: 'line1\nline2\nline3\nline4\nline5',
				start: 1,
				end: 5,
				totalLines: 5,
			});
		});

		test('指定した行範囲 (1-based, inclusive) を取り出す', () => {
			const result = extractLines(content, { start: 2, end: 4 });

			expect(result).toStrictEqual({
				code: 'line2\nline3\nline4',
				start: 2,
				end: 4,
				totalLines: 5,
			});
		});

		test('末尾の改行で生じる空行は行数に数えない', () => {
			expect(extractLines('a\nb\n', null).totalLines).toBe(2);
			expect(extractLines('a\nb', null).totalLines).toBe(2);
		});

		test('ファイルの行数を超える範囲はファイル末尾に丸める', () => {
			const result = extractLines(content, { start: 4, end: 100 });

			expect(result).toStrictEqual({
				code: 'line4\nline5',
				start: 4,
				end: 5,
				totalLines: 5,
			});
		});

		test('開始行がファイルの行数を超える場合は最終行を返す', () => {
			const result = extractLines(content, { start: 100, end: 200 });

			expect(result).toStrictEqual({
				code: 'line5',
				start: 5,
				end: 5,
				totalLines: 5,
			});
		});

		test('CRLF の改行も行として分割する', () => {
			const result = extractLines('a\r\nb\r\nc\r\n', { start: 2, end: 3 });

			expect(result.code).toBe('b\nc');
			expect(result.totalLines).toBe(3);
		});

		test('空のファイルは 1 行の空文字として扱う', () => {
			const result = extractLines('', null);

			expect(result).toStrictEqual({ code: '', start: 1, end: 1, totalLines: 1 });
		});
	});

	describe('resolveLanguage', () => {
		test.each([
			['src/index.ts', 'ts'],
			['src/App.tsx', 'tsx'],
			['src/index.mjs', 'mjs'],
			['src/index.mts', 'mts'],
			['config.yml', 'yml'],
			['README.md', 'md'],
			['src/main.rs', 'rs'],
			['scripts/build.py', 'py'],
			['scripts/build.sh', 'sh'],
			['src/Main.kt', 'kt'],
			['pnpm-lock.yaml', 'yaml'],
			['tsconfig.json', 'json'],
		])('shiki の alias である拡張子 %s はそのまま %s を返す', (path, expected) => {
			expect(resolveLanguage(path)).toBe(expected);
		});

		test('shiki が知らない拡張子は補完表で解決する (include/foo.h → c など)', () => {
			expect(resolveLanguage('include/foo.h')).toBe('c');
			expect(resolveLanguage('include/foo.hpp')).toBe('cpp');
		});

		test('拡張子の大文字小文字は区別しない', () => {
			expect(resolveLanguage('src/Index.TS')).toBe('ts');
		});

		test('特定のファイル名は拡張子が無くても言語を判定する', () => {
			expect(resolveLanguage('Dockerfile')).toBe('docker');
			expect(resolveLanguage('docker/Makefile')).toBe('makefile');
			expect(resolveLanguage('.gitignore')).toBe('gitignore');
		});

		test('shiki の言語 ID / alias である拡張子はそのまま返す', () => {
			expect(resolveLanguage('src/index.astro')).toBe('astro');
			expect(resolveLanguage('main.go')).toBe('go');
			expect(resolveLanguage('Cargo.toml')).toBe('toml');
		});

		test('shiki が知らない拡張子は補完表で解決する', () => {
			expect(resolveLanguage('src/main.m')).toBe('objective-c');
			expect(resolveLanguage('lib/app.ex')).toBe('elixir');
			expect(resolveLanguage('icon.svg')).toBe('xml');
		});

		test('どちらにも無い拡張子は txt にする', () => {
			expect(resolveLanguage('src/foo.unknownext')).toBe('txt');
			expect(resolveLanguage('pnpm-lock.yaml.snap')).toBe('txt');
		});

		test('拡張子が無いファイルは txt にする', () => {
			expect(resolveLanguage('LICENSE')).toBe('txt');
		});
	});

	describe('fetchGitHubPermalink', () => {
		test('raw.githubusercontent.com からファイルを取得し、指定行を切り出したスニペットを返す', async () => {
			const fetcher = createFetcher('a\nb\nc\nd\n');

			const result = await fetchGitHubPermalink(
				'https://github.com/re-taro/aurelia/blob/abc123/src/fetch-test-1.ts#L2-L3',
				fetcher,
			);

			expect(fetcher.mock.calls[0]?.[0]).toBe(
				'https://raw.githubusercontent.com/re-taro/aurelia/abc123/src/fetch-test-1.ts',
			);
			expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).get('User-Agent')).toBeTypeOf('string');
			expect(result).toStrictEqual({
				owner: 're-taro',
				repo: 'aurelia',
				ref: 'abc123',
				path: 'src/fetch-test-1.ts',
				url: 'https://github.com/re-taro/aurelia/blob/abc123/src/fetch-test-1.ts#L2-L3',
				startLine: 2,
				endLine: 3,
				totalLines: 4,
				lang: 'ts',
				code: 'b\nc',
			});
		});

		test('行範囲が無い場合はファイル全体を返し、URL にフラグメントを付けない', async () => {
			const result = await fetchGitHubPermalink(
				'https://github.com/re-taro/aurelia/blob/abc123/src/fetch-test-2.ts',
				createFetcher('a\nb\n'),
			);

			expect(result.code).toBe('a\nb');
			expect(result.url).toBe('https://github.com/re-taro/aurelia/blob/abc123/src/fetch-test-2.ts');
		});

		test('同じファイルは行範囲が違っても 1 回しか取得しない', async () => {
			const fetcher = createFetcher('a\nb\nc\n');

			await fetchGitHubPermalink('https://github.com/re-taro/aurelia/blob/abc123/src/fetch-test-3.ts#L1', fetcher);
			await fetchGitHubPermalink('https://github.com/re-taro/aurelia/blob/abc123/src/fetch-test-3.ts#L3', fetcher);

			expect(fetcher).toHaveBeenCalledOnce();
		});

		test('GitHub permalink でない URL は例外を投げる', async () => {
			await expect(fetchGitHubPermalink('https://example.com/foo', createFetcher(''))).rejects.toThrow(
				'Not a GitHub permalink',
			);
		});

		test('取得に失敗した場合は例外を投げ、次回は再試行する', async () => {
			const url = 'https://github.com/re-taro/aurelia/blob/abc123/src/fetch-test-4.ts';
			const failing = createFetcher('Not Found', { status: 404, statusText: 'Not Found' });

			await expect(fetchGitHubPermalink(url, failing)).rejects.toThrow('404 Not Found');

			const succeeding = createFetcher('ok\n');
			await expect(fetchGitHubPermalink(url, succeeding)).resolves.toMatchObject({ code: 'ok' });
			expect(succeeding).toHaveBeenCalledOnce();
		});
	});
});
