import { FUTURE_POST, POSTS } from '../definitions';
import { expect, test } from '../fixtures/test';

test.describe('記事の一覧', () => {
	test('公開済みの記事を公開年ごとに新しい順で並べる', async ({ capture, homePage }) => {
		await homePage.goto();

		await expect(homePage.heading).toHaveText('Index');
		await expect(homePage.postsOf(2025)).toHaveText([
			`04-01${POSTS.markdown.title}`,
			`03-01${POSTS.code.title}`,
			`02-01${POSTS.media.title}`,
		]);
		await expect(homePage.postsOf(2024)).toHaveText([`12-24${POSTS.note.title}`]);
		await expect(homePage.postLink(FUTURE_POST.title)).toHaveCount(0);
		await capture('default');
	});
});
