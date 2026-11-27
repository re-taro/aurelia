import { FUTURE_POST, POSTS } from '../definitions';
import { expect, NOT_FOUND_RESPONSE, test } from '../fixtures/test';

test.describe('タグの一覧', () => {
	test('公開済みの記事のタグを、記事の多い順に並べる', async ({ capture, tagsPage }) => {
		await tagsPage.goto();

		await expect(tagsPage.heading).toHaveText('Tags');
		await expect(tagsPage.tagLinks.first()).toHaveText('Test Fixture');
		await expect(tagsPage.tagLinks).toHaveCount(5);
		await expect(tagsPage.tagLink(FUTURE_POST.tag)).toHaveCount(0);
		await capture('list');
	});

	test('タグの名前を URL 向けに変えたページへリンクする', async ({ tagsPage }) => {
		await tagsPage.goto();

		await expect(tagsPage.tagLink('Test Fixture')).toHaveAttribute('href', '/tags/test-fixture');
	});
});

test.describe('タグごとの記事の一覧', () => {
	test('そのタグのついた記事を新しい順に並べる', async ({ capture, tagPage }) => {
		await tagPage.goto('test-fixture');

		await expect(tagPage.heading).toHaveText('test-fixture');
		await expect(tagPage.posts).toHaveText([
			`04-01${POSTS.markdown.title}`,
			`03-01${POSTS.code.title}`,
			`02-01${POSTS.media.title}`,
			`12-24${POSTS.note.title}`,
		]);
		await capture('test-fixture');
	});

	test.describe('公開日が未来の記事にしかないタグ', () => {
		test.use({ allowedErrors: [NOT_FOUND_RESPONSE] });

		test('ページを作らない', async ({ notFoundPage }) => {
			await notFoundPage.goto('/tags/future');

			await expect(notFoundPage.heading).toHaveText('404 Not Found');
		});
	});
});
