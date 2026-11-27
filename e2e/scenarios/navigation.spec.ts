import { POSTS } from '../definitions';
import { expect, test } from '../fixtures/test';

/**
 * ClientRouter による遷移。ページを読み直さずに中身を差し替える
 */
test.describe('ページの遷移', () => {
	test('一覧から記事、タグ、一覧へとたどれる', async ({ homePage, page, postPage, tagPage }) => {
		await homePage.goto();
		// 遷移のあいだ window が同じままなら、ページを読み直していない
		await page.evaluate(() => {
			Object.assign(globalThis, { e2eNotReloaded: true });
		});

		await homePage.postLink(POSTS.markdown.title).click();

		await expect(page).toHaveURL(new RegExp(`/p/${POSTS.markdown.id}/?$`, 'u'));
		await expect(postPage.heading).toHaveText(POSTS.markdown.title);
		await expect(page).toHaveTitle(`${POSTS.markdown.title} - blog.re-taro.dev`);
		await postPage.waitForTransition();

		await postPage.tagLink('Test Fixture').click();

		await expect(page).toHaveURL(/\/tags\/test-fixture\/?$/u);
		await expect(tagPage.heading).toHaveText('test-fixture');
		await tagPage.waitForTransition();

		await tagPage.siteLink.click();

		await expect(page).toHaveURL(/\/$/u);
		await expect(homePage.heading).toHaveText('Index');
		expect(await page.evaluate(() => 'e2eNotReloaded' in globalThis)).toBe(true);
	});

	test('ブラウザの戻る・進むで前のページに戻れる', async ({ homePage, page, postPage }) => {
		await homePage.goto();
		await homePage.postLink(POSTS.note.title).click();
		await expect(postPage.heading).toHaveText(POSTS.note.title);
		await postPage.waitForTransition();

		await page.goBack();

		await expect(homePage.heading).toHaveText('Index');
		await homePage.waitForTransition();

		await page.goForward();

		await expect(postPage.heading).toHaveText(POSTS.note.title);
	});

	test('コードのある記事へ遷移しても、差し替えた直後から横にはみ出さない', async ({ homePage, page, postPage }) => {
		test.fixme(
			true,
			'astro-expressive-code はコードブロックの CSS を本文の中に <link> で出す。ClientRouter は <head> の CSS しか先読みしないので、' +
				'差し替えた直後はコードブロックにスタイルが当たらず、長い行がページを押し広げる。SP ではこれで View Transition が中断される',
		);

		await homePage.goto();
		await page.evaluate(() => {
			document.addEventListener('astro:after-swap', () => {
				Object.assign(globalThis, { e2eScrollWidth: document.documentElement.scrollWidth });
			});
		});
		await homePage.postLink(POSTS.code.title).click();

		await expect(postPage.heading).toHaveText(POSTS.code.title);
		await postPage.waitForTransition();
		expect(await page.evaluate(() => Number(Reflect.get(globalThis, 'e2eScrollWidth')))).toBe(
			await page.evaluate(() => document.documentElement.clientWidth),
		);
	});

	test('フッターからプライバシーポリシーを開ける', async ({ homePage, page, privacyPage }) => {
		await homePage.goto();
		await homePage.privacyLink.click();

		await expect(page).toHaveURL(/\/privacy\/?$/u);
		await expect(privacyPage.heading).toHaveText('Privacy Policy');
	});

	test('ヘッダーから RSS とポートフォリオへリンクする', async ({ homePage }) => {
		await homePage.goto();

		await expect(homePage.rssLink).toHaveAttribute('href', '/rss.xml');
		await expect(homePage.portfolioLink).toHaveAttribute('href', 'https://re-taro.dev');
		await expect(homePage.portfolioLink).toHaveAttribute('target', '_blank');
		await expect(homePage.portfolioLink).toHaveAttribute('rel', 'noreferrer');
	});
});
