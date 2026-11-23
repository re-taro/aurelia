import type { Code, Link, Paragraph, Root, Text } from 'mdast';
import type { MdxJsxAttribute, MdxJsxFlowElement } from 'mdast-util-mdx-jsx';
import { CONTINUE, SKIP, visit } from 'unist-util-visit';

import type { GitHubPermalinkSnippet } from '../../github/definitions';
import { fetchGitHubPermalink, parseGitHubPermalink } from '../../github/services';
import { GITHUB_PERMALINK_COMPONENT_NAME } from '../definitions';

export type RemarkAureliaGitHubPermalinkOptions = {
	fetcher?: typeof fetch;
};

const isText = (node: Paragraph['children'][number]): node is Text => node.type === 'text';
const isLink = (node: Paragraph['children'][number]): node is Link => node.type === 'link';

const extractBareURL = (paragraph: Paragraph): string | null => {
	if (paragraph.children.length !== 1) {
		return null;
	}
	const [child] = paragraph.children;
	if (child == null) {
		return null;
	}

	if (isText(child)) {
		return child.value.trim();
	}

	if (isLink(child)) {
		if (child.children.length !== 1) {
			return null;
		}
		const [label] = child.children;
		if (label == null || !isText(label) || label.value.trim() !== child.url) {
			return null;
		}
		return child.url;
	}

	return null;
};

const attribute = (name: string, value: string | number): MdxJsxAttribute => ({
	type: 'mdxJsxAttribute',
	name,
	value: value.toString(),
});

const toElement = (snippet: GitHubPermalinkSnippet, paragraph: Paragraph): MdxJsxFlowElement => {
	const fileName = snippet.path.split('/').at(-1) ?? snippet.path;
	const code: Code = {
		type: 'code',
		lang: snippet.lang,
		meta: `title="${fileName}"`,
		value: snippet.code,
	};

	return {
		type: 'mdxJsxFlowElement',
		name: GITHUB_PERMALINK_COMPONENT_NAME,
		attributes: [
			attribute('url', snippet.url),
			attribute('owner', snippet.owner),
			attribute('repo', snippet.repo),
			attribute('ref', snippet.ref),
			attribute('path', snippet.path),
			attribute('startLine', snippet.startLine),
			attribute('endLine', snippet.endLine),
			attribute('totalLines', snippet.totalLines),
		],
		children: [code],
		...(paragraph.position == null ? {} : { position: paragraph.position }),
	};
};

export const remarkAureliaGitHubPermalink = (options: RemarkAureliaGitHubPermalinkOptions = {}) => {
	const { fetcher = fetch } = options;

	return async (tree: Root): Promise<void> => {
		const replacements: Promise<void>[] = [];

		visit(tree, (node, index, parent) => {
			if (node.type === 'footnoteDefinition') {
				return SKIP;
			}
			if (node.type !== 'paragraph' || index == null || parent == null) {
				return CONTINUE;
			}

			const url = extractBareURL(node);
			if (url == null || parseGitHubPermalink(url) == null) {
				return CONTINUE;
			}

			replacements.push(
				(async () => {
					parent.children[index] = toElement(await fetchGitHubPermalink(url, fetcher), node);
				})(),
			);
			return CONTINUE;
		});

		await Promise.all(replacements);
	};
};
