import { POSTS } from '../../definitions';
import { expect, test } from '../../fixtures/test';

const SITE = 'https://blog.re-taro.dev';

/**
 * 検索エンジンや SNS が読む <head> の中身
 */
test.describe('meta', () => {
	test('記事のページ', async ({ page }) => {
		await page.goto(`/p/${POSTS.markdown.id}`);

		const meta = async (selector: string): Promise<string | null> =>
			page.locator(`head ${selector}`).getAttribute('content');

		expect({
			title: await page.title(),
			canonical: await page.locator('head link[rel="canonical"]').getAttribute('href'),
			description: await meta('meta[name="description"]'),
			ogTitle: await meta('meta[property="og:title"]'),
			ogType: await meta('meta[property="og:type"]'),
			ogImage: await meta('meta[property="og:image"]'),
			publishedTime: await meta('meta[property="article:published_time"]'),
			modifiedTime: await meta('meta[property="article:modified_time"]'),
			twitterCard: await meta('meta[name="twitter:card"]'),
		}).toStrictEqual({
			title: `${POSTS.markdown.title} - blog.re-taro.dev`,
			canonical: `${SITE}/p/${POSTS.markdown.id}/`,
			description: '見出し・段落・リスト・表・引用・脚注・数式など、本文で使う Markdown の要素をひととおり並べた記事',
			ogTitle: `${POSTS.markdown.title} - blog.re-taro.dev`,
			ogType: 'article',
			ogImage: `${SITE}/p/${POSTS.markdown.id}/og-image.png`,
			publishedTime: '2025-04-01T00:00:00Z',
			modifiedTime: '2025-05-01T00:00:00Z',
			twitterCard: 'summary_large_image',
		});
	});

	test('トップページ', async ({ page }) => {
		await page.goto('/');

		await expect(page).toHaveTitle('blog.re-taro.dev');
		await expect(page.locator('head meta[property="og:type"]')).toHaveAttribute('content', 'website');
		await expect(page.locator('head meta[property="og:image"]')).toHaveAttribute('content', `${SITE}/og-image.png`);
		await expect(page.locator('head link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
			'href',
			`${SITE}/rss.xml`,
		);
	});
});
