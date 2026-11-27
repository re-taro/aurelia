import { POSTS } from '../definitions';
import { expect, NOT_FOUND_RESPONSE, test } from '../fixtures/test';

test.describe('プライバシーポリシー', () => {
	test('Google Analytics を使っていることを示す', async ({ capture, privacyPage }) => {
		await privacyPage.goto();

		await expect(privacyPage.heading).toHaveText('Privacy Policy');
		await expect(privacyPage.main.getByRole('link', { name: 'Google Analytics' })).toHaveAttribute(
			'href',
			'https://policies.google.com/technologies/partner-sites',
		);
		await capture('privacy');
	});
});

test.describe('存在しないページ', () => {
	test.use({ allowedErrors: [NOT_FOUND_RESPONSE] });

	test('404 を返し、最新の記事を案内する', async ({ capture, notFoundPage, page }) => {
		const response = await page.goto('/this/page/does/not/exist');

		expect(response?.status()).toBe(404);
		await expect(notFoundPage.heading).toHaveText('404 Not Found');
		await expect(notFoundPage.latestPosts).toHaveText([
			`04-01${POSTS.markdown.title}`,
			`03-01${POSTS.code.title}`,
			`02-01${POSTS.media.title}`,
			`12-24${POSTS.note.title}`,
		]);
		await capture('not-found');
	});
});
