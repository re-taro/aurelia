import { describe, expect, test } from 'vitest';

import { createPost } from '../context/post/factories';

import { createContentCollection } from './factories';
import { postClient } from './PostClient';

const PAST = '2024-03-01T09:00:00+09:00[Asia/Tokyo]';
const OLDER = '2023-03-01T09:00:00+09:00[Asia/Tokyo]';
const FUTURE = '2999-01-01T00:00:00+09:00[Asia/Tokyo]';

describe('postClient', () => {
	describe('fetch', () => {
		test('ID の一致する記事を返す', async () => {
			const post = createPost({ id: 'a', data: { publishedAt: PAST } });

			await expect(postClient.fetch(createContentCollection([post]), { id: 'a' })).resolves.toStrictEqual({ post });
		});

		test('見つからなければ null を返す', async () => {
			await expect(postClient.fetch(createContentCollection([]), { id: 'a' })).resolves.toStrictEqual({ post: null });
		});
	});

	describe('fetchAll', () => {
		test('公開日の新しい順に並べる', async () => {
			const older = createPost({ id: 'older', data: { publishedAt: OLDER } });
			const newer = createPost({ id: 'newer', data: { publishedAt: PAST } });

			const { posts, total } = await postClient.fetchAll(createContentCollection([older, newer]), {});

			expect(posts.map(({ id }) => id)).toStrictEqual(['newer', 'older']);
			expect(total).toBe(2);
		});

		test('タイムゾーンが違っても時刻で比べる', async () => {
			// 2024-03-01T00:30Z と 2024-03-01T00:00Z。JST の日付は同じだが、UTC 表記のほうが 30 分あと
			const utc = createPost({ id: 'utc', data: { publishedAt: '2024-03-01T00:30:00+00:00[UTC]' } });
			const jst = createPost({ id: 'jst', data: { publishedAt: '2024-03-01T09:00:00+09:00[Asia/Tokyo]' } });

			const { posts } = await postClient.fetchAll(createContentCollection([jst, utc]), {});

			expect(posts.map(({ id }) => id)).toStrictEqual(['utc', 'jst']);
		});

		test('公開日が未来の記事を除く', async () => {
			const published = createPost({ id: 'published', data: { publishedAt: PAST } });
			const scheduled = createPost({ id: 'scheduled', data: { publishedAt: FUTURE } });

			const { posts, total } = await postClient.fetchAll(createContentCollection([published, scheduled]), {});

			expect(posts.map(({ id }) => id)).toStrictEqual(['published']);
			expect(total).toBe(1);
		});

		test('draft では公開日が未来の記事も含める', async () => {
			const published = createPost({ id: 'published', data: { publishedAt: PAST } });
			const scheduled = createPost({ id: 'scheduled', data: { publishedAt: FUTURE } });

			const { posts } = await postClient.fetchAll(createContentCollection([published, scheduled]), { draft: true });

			expect(posts.map(({ id }) => id)).toStrictEqual(['scheduled', 'published']);
		});

		test('tag を渡すと、正規化したタグが一致する記事だけを返す', async () => {
			const astro = createPost({ id: 'astro', data: { publishedAt: PAST, tags: ['Astro', 'Web Components'] } });
			const react = createPost({ id: 'react', data: { publishedAt: OLDER, tags: ['React'] } });

			const collection = createContentCollection([astro, react]);

			await expect(postClient.fetchAll(collection, { tag: 'web-components' })).resolves.toStrictEqual({
				posts: [astro],
				total: 1,
			});
			await expect(postClient.fetchAll(collection, { tag: 'Astro' })).resolves.toStrictEqual({ posts: [], total: 0 });
		});

		test('公開日が未来の記事は、tag が一致しても除く', async () => {
			const scheduled = createPost({ id: 'scheduled', data: { publishedAt: FUTURE, tags: ['Astro'] } });

			await expect(postClient.fetchAll(createContentCollection([scheduled]), { tag: 'astro' })).resolves.toStrictEqual({
				posts: [],
				total: 0,
			});
		});
	});
});
