import { FUTURE_POST, POSTS } from '../definitions';
import { expect, NOT_FOUND_RESPONSE, test } from '../fixtures/test';

test.describe('Markdown の記事', () => {
	test('見出し・リスト・表・引用・数式・脚注を表示する', async ({ capture, postPage }) => {
		await postPage.goto(POSTS.markdown.id);

		await expect(postPage.heading).toHaveText(POSTS.markdown.title);
		await expect(postPage.page).toHaveTitle(`${POSTS.markdown.title} - blog.re-taro.dev`);
		await expect(postPage.publishedAt).toHaveText('2025-04-01');
		await expect(postPage.updatedAt).toHaveText('2025-05-01');
		await expect(postPage.article.getByRole('table')).toBeVisible();
		await expect(postPage.math).toHaveCount(3);
		await expect(postPage.footnotes.getByRole('listitem')).toHaveCount(2);
		await expect(postPage.article).toContainText(
			'これは e2e のための記事である。日本語の文が改行をまたいでも、間に空白が入らずにつながる。',
		);
		await capture('markdown');
	});

	test('目次を開いて見出しへ移動できる', async ({ capture, postPage }) => {
		await postPage.goto(POSTS.markdown.id);
		await postPage.tocButton.click();

		await expect(postPage.toc).toBeVisible();
		await expect(postPage.toc.getByRole('link')).toHaveText([
			'##段落と強調',
			'##リスト',
			'###順序なしリスト',
			'###順序つきリスト',
			'###タスクリスト',
			'##引用と区切り線',
			'##表',
			'##数式',
			'##脚注',
			'####4 段目の見出し',
			'##Footnotes',
		]);
		await expect(postPage.tocButton).toHaveAccessibleName(/\bclose\b/u);
		await capture('toc-open', { fullPage: false });

		await postPage.tocLink('数式').click();

		await expect(postPage.toc).toBeHidden();
		await expect.poll(() => decodeURIComponent(new URL(postPage.page.url()).hash)).toBe('#数式');
		await expect(postPage.sectionHeading('数式')).toBeInViewport();
	});
});

test.describe('コードの記事', () => {
	test('コードブロックと GitHub のパーマリンクを表示する', async ({ capture, postPage }) => {
		await postPage.goto(POSTS.code.id);

		await expect(postPage.heading).toHaveText(POSTS.code.title);
		await expect(postPage.codeBlocks).toHaveCount(8);
		await expect(postPage.codeBlocks.filter({ hasText: 'src/greet.ts' })).toBeVisible();
		await expect(postPage.permalinks).toHaveCount(1);
		await expect(postPage.permalinks.getByRole('link')).toHaveText('re-taro/blog.re-taro.dev@3c06bf9 L3-L7');
		await expect(postPage.permalinks).toContainText('MOBILE: 560');
		await capture('code');
	});
});

test.describe('画像とリンクカードの記事', () => {
	test.use({
		allowedErrors: [/example\.com%2Fmissing/u, 'Failed to fetch open graph data'],
	});

	test('画像とリンクカードを表示する', async ({ capture, postPage }) => {
		await postPage.goto(POSTS.media.id);

		await expect(postPage.heading).toHaveText(POSTS.media.title);
		await expect(postPage.article.getByRole('img', { name: '横長の画像' })).toBeVisible();
		await expect(postPage.article.getByRole('img', { name: '縦長の画像' })).toHaveAttribute(
			'title',
			'タイトルつきの画像',
		);
		await expect(postPage.linkCards).toHaveCount(4);

		await capture('media');

		const large = postPage.linkCard('https://example.com/large');
		await expect(large).toContainText('大きな画像のカード');
		await expect(large).toContainText('twitter:card が summary_large_image のページ。');
		await expect(large.locator('img[src^="/api/og/image"]')).toHaveJSProperty('naturalHeight', 128);

		const small = postPage.linkCard('https://example.com/small');
		await expect(small).toContainText('小さな画像のカード');
		await expect(small).toContainText('og:description がないので description を使う。');
		await expect(small.locator('img[src^="/api/og/image"]')).toHaveJSProperty('naturalHeight', 128);

		const plain = postPage.linkCard('https://example.com/plain');
		await expect(plain).toContainText('画像のないカード & エスケープされたタイトル');
		await expect(plain.locator('img[src^="/api/og/image"]')).toHaveCount(0);

		const missing = postPage.linkCard('https://example.com/missing');
		await expect(missing).toHaveText('example.comexample.com');
	});

	test('記事の画像を読み込める', async ({ postPage }) => {
		await postPage.goto(POSTS.media.id);

		for (const name of ['横長の画像', '縦長の画像']) {
			const image = postPage.article.getByRole('img', { name });

			await image.scrollIntoViewIfNeeded();
			await expect
				.poll(async () => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth))
				.toBeGreaterThan(0);
		}
	});
});

test.describe('見出しのない記事', () => {
	test('目次のボタンを出さない', async ({ capture, postPage }) => {
		await postPage.goto(POSTS.note.id);

		await expect(postPage.heading).toHaveText(POSTS.note.title);
		await expect(postPage.updatedAt).toHaveCount(0);
		await expect(postPage.tocButton).toHaveCount(0);
		await capture('note');
	});
});

test.describe('公開日が未来の記事', () => {
	test.use({ allowedErrors: [NOT_FOUND_RESPONSE] });

	test('ページを作らない', async ({ notFoundPage }) => {
		await notFoundPage.goto(`/p/${FUTURE_POST.id}`);

		await expect(notFoundPage.heading).toHaveText('404 Not Found');
	});
});
