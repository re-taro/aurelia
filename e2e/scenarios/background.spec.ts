import { POSTS } from '../definitions';
import { expect, test } from '../fixtures/test';

/**
 * 背景のクラゲ (WebGL)。絶えず動くのでスクリーンショットでは隠し、ここで動いていることを確かめる
 */
test.describe('背景', () => {
	test('WebGL で描画を始める', async ({ layout, page }) => {
		await page.goto('/');

		const canvas = layout.background.locator('canvas');

		// 描画が始まると、canvas の解像度を既定の 300x150 から表示サイズに合わせる。
		// 倍率は端末 (と Chrome のエミュレーション) で変わるので、縦横比と大きさだけを見る
		await expect
			.poll(async () =>
				canvas.evaluate((element: HTMLCanvasElement) => ({
					aspectRatio: Math.abs(element.width / element.height - element.clientWidth / element.clientHeight) < 0.01,
					resolution: element.width >= element.clientWidth && element.height >= element.clientHeight,
				})),
			)
			.toStrictEqual({ aspectRatio: true, resolution: true });
	});

	test('記事では読む用の見え方に切り替え、遷移をまたいで同じ canvas を使い続ける', async ({
		homePage,
		page,
		postPage,
	}) => {
		await homePage.goto();
		await expect(page.locator('html')).toHaveAttribute('data-background', 'ambient');
		await homePage.background.evaluate((element) => {
			Object.assign(element, { e2eMarker: true });
		});

		await homePage.postLink(POSTS.markdown.title).click();

		await expect(postPage.heading).toHaveText(POSTS.markdown.title);
		await postPage.waitForTransition();
		await expect(page.locator('html')).toHaveAttribute('data-background', 'reading');
		await expect(postPage.background).toHaveCount(1);
		expect(await postPage.background.evaluate((element) => 'e2eMarker' in element)).toBe(true);
	});

	test('コントラストを上げる設定では出さない', async ({ layout, page }) => {
		await page.emulateMedia({ contrast: 'more' });
		await page.goto('/');

		await expect(layout.heading).toBeVisible();
		await expect(layout.background).toBeHidden();
	});
});
