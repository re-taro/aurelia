import type { FootnoteDefinition, Paragraph, Root } from 'mdast';
import { describe, expect, test, vi, type Mock } from 'vitest';

import { remarkAureliaGitHubPermalink } from './remark-aurelia-github-permalink';

const PERMALINK = 'https://github.com/re-taro/aurelia/blob/abc123/src/remark-test.ts#L2-L3';
const FILE_CONTENT = 'line1\nline2\nline3\nline4\n';

const textParagraph = (value: string): Paragraph => ({ type: 'paragraph', children: [{ type: 'text', value }] });

const autolinkParagraph = (url: string, label = url): Paragraph => ({
	type: 'paragraph',
	children: [{ type: 'link', url, children: [{ type: 'text', value: label }] }],
});

const createFetcher = (body = FILE_CONTENT): Mock<typeof fetch> =>
	vi.fn<typeof fetch>(() => Promise.resolve(new Response(body)));

const transform = async (tree: Root, fetcher = createFetcher()): Promise<Root> => {
	await remarkAureliaGitHubPermalink({ fetcher })(tree);
	return tree;
};

const expectedElement = {
	type: 'mdxJsxFlowElement',
	name: 'aurelia-gh-perma-link',
	attributes: [
		{ type: 'mdxJsxAttribute', name: 'url', value: PERMALINK },
		{ type: 'mdxJsxAttribute', name: 'owner', value: 're-taro' },
		{ type: 'mdxJsxAttribute', name: 'repo', value: 'aurelia' },
		{ type: 'mdxJsxAttribute', name: 'ref', value: 'abc123' },
		{ type: 'mdxJsxAttribute', name: 'path', value: 'src/remark-test.ts' },
		{ type: 'mdxJsxAttribute', name: 'startLine', value: '2' },
		{ type: 'mdxJsxAttribute', name: 'endLine', value: '3' },
		{ type: 'mdxJsxAttribute', name: 'totalLines', value: '4' },
	],
	children: [{ type: 'code', lang: 'ts', meta: 'title="remark-test.ts"', value: 'line2\nline3' }],
};

describe('remarkAureliaGitHubPermalink', () => {
	test('素の URL テキストだけの段落を、取得したコードを含む GitHubPermalink 要素に置き換える', async () => {
		const fetcher = createFetcher();
		const tree = await transform({ type: 'root', children: [textParagraph(PERMALINK)] }, fetcher);

		expect(tree.children).toStrictEqual([expectedElement]);
		expect(fetcher).toHaveBeenCalledWith(
			'https://raw.githubusercontent.com/re-taro/aurelia/abc123/src/remark-test.ts',
			expect.anything(),
		);
	});

	test('GFM autolink (link ノード) だけの段落も置き換える', async () => {
		const tree = await transform({ type: 'root', children: [autolinkParagraph(PERMALINK)] });

		expect(tree.children).toStrictEqual([expectedElement]);
	});

	test('URL 前後の空白は無視する', async () => {
		const tree = await transform({ type: 'root', children: [textParagraph(`  ${PERMALINK}\n`)] });

		expect(tree.children).toStrictEqual([expectedElement]);
	});

	test('段落の位置情報を引き継ぐ', async () => {
		const position = { start: { line: 3, column: 1, offset: 10 }, end: { line: 3, column: 60, offset: 69 } };
		const tree = await transform({ type: 'root', children: [{ ...textParagraph(PERMALINK), position }] });

		expect(tree.children[0]).toMatchObject({ type: 'mdxJsxFlowElement', position });
	});

	test('root 直下以外 (blockquote 内など) の段落も置き換える', async () => {
		const tree = await transform({
			type: 'root',
			children: [{ type: 'blockquote', children: [textParagraph(PERMALINK)] }],
		});

		expect(tree.children[0]).toMatchObject({ type: 'blockquote', children: [expectedElement] });
	});

	test('複数の permalink を並行して取得し、それぞれの位置に置き換える', async () => {
		const other = 'https://github.com/re-taro/aurelia/blob/abc123/src/remark-test-other.ts#L1';
		const tree = await transform({
			type: 'root',
			children: [textParagraph(PERMALINK), textParagraph('between'), textParagraph(other)],
		});

		expect(tree.children[0]).toMatchObject({ name: 'aurelia-gh-perma-link' });
		expect(tree.children[1]).toStrictEqual(textParagraph('between'));
		expect(tree.children[2]).toMatchObject({
			name: 'aurelia-gh-perma-link',
			children: [{ type: 'code', value: 'line1' }],
		});
	});

	test('footnote 定義内の permalink は取得も置き換えもしない', async () => {
		const fetcher = createFetcher();
		const footnote: FootnoteDefinition = {
			type: 'footnoteDefinition',
			identifier: '1',
			label: '1',
			children: [textParagraph(PERMALINK), autolinkParagraph(PERMALINK)],
		};
		const tree = await transform({ type: 'root', children: [footnote] }, fetcher);

		expect(tree.children).toStrictEqual([footnote]);
		expect(fetcher).not.toHaveBeenCalled();
	});

	test('GitHub permalink 以外の URL は取得も置き換えもしない', async () => {
		const fetcher = createFetcher();
		const paragraph = textParagraph('https://example.com/foo');
		const tree = await transform({ type: 'root', children: [paragraph] }, fetcher);

		expect(tree.children).toStrictEqual([paragraph]);
		expect(fetcher).not.toHaveBeenCalled();
	});

	test('URL 以外のテキストを含む段落は置き換えない', async () => {
		const paragraph: Paragraph = {
			type: 'paragraph',
			children: [
				{ type: 'text', value: 'see ' },
				{ type: 'link', url: PERMALINK, children: [{ type: 'text', value: PERMALINK }] },
			],
		};
		const tree = await transform({ type: 'root', children: [paragraph] });

		expect(tree.children).toStrictEqual([paragraph]);
	});

	test('ラベル付きリンク ([label](url)) は置き換えない', async () => {
		const paragraph = autolinkParagraph(PERMALINK, 'remark-test.ts');
		const tree = await transform({ type: 'root', children: [paragraph] });

		expect(tree.children).toStrictEqual([paragraph]);
	});

	test('取得に失敗した場合は例外を投げる', async () => {
		const failing = vi.fn<typeof fetch>(() =>
			Promise.resolve(new Response('Not Found', { status: 404, statusText: 'Not Found' })),
		);
		const url = 'https://github.com/re-taro/aurelia/blob/abc123/src/remark-test-missing.ts';

		await expect(transform({ type: 'root', children: [textParagraph(url)] }, failing)).rejects.toThrow('404 Not Found');
	});
});
