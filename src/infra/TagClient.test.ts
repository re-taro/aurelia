import { describe, expect, test } from 'vitest';

import { createPost } from '../context/post/factories';

import { createContentCollection } from './factories';
import { tagClient } from './TagClient';

const PAST = '2024-03-01T09:00:00+09:00[Asia/Tokyo]';
const FUTURE = '2999-01-01T00:00:00+09:00[Asia/Tokyo]';

describe('tagClient', () => {
	describe('fetchAll', () => {
		test('記事の多いタグから並べる', async () => {
			const collection = createContentCollection([
				createPost({ id: 'a', data: { publishedAt: PAST, tags: ['Astro'] } }),
				createPost({ id: 'b', data: { publishedAt: PAST, tags: ['React', 'Astro'] } }),
				createPost({ id: 'c', data: { publishedAt: PAST, tags: ['React', 'Astro'] } }),
				createPost({ id: 'd', data: { publishedAt: PAST, tags: ['Rust'] } }),
			]);

			await expect(tagClient.fetchAll(collection, {})).resolves.toStrictEqual({
				tags: ['Astro', 'React', 'Rust'],
				total: 3,
			});
		});

		test('記事の数が同じタグは、最初に現れた順を保つ', async () => {
			const collection = createContentCollection([
				createPost({ id: 'a', data: { publishedAt: PAST, tags: ['Zig', 'Go'] } }),
				createPost({ id: 'b', data: { publishedAt: PAST, tags: ['Astro'] } }),
			]);

			await expect(tagClient.fetchAll(collection, {})).resolves.toStrictEqual({
				tags: ['Zig', 'Go', 'Astro'],
				total: 3,
			});
		});

		test('公開日が未来の記事のタグは数えない', async () => {
			const collection = createContentCollection([
				createPost({ id: 'a', data: { publishedAt: PAST, tags: ['Astro'] } }),
				createPost({ id: 'b', data: { publishedAt: FUTURE, tags: ['Astro', 'Future'] } }),
				createPost({ id: 'c', data: { publishedAt: PAST, tags: ['React'] } }),
				createPost({ id: 'd', data: { publishedAt: PAST, tags: ['React'] } }),
			]);

			await expect(tagClient.fetchAll(collection, {})).resolves.toStrictEqual({
				tags: ['React', 'Astro'],
				total: 2,
			});
		});

		test('draft では公開日が未来の記事のタグも数える', async () => {
			const collection = createContentCollection([
				createPost({ id: 'a', data: { publishedAt: FUTURE, tags: ['Future'] } }),
			]);

			await expect(tagClient.fetchAll(collection, { draft: true })).resolves.toStrictEqual({
				tags: ['Future'],
				total: 1,
			});
		});
	});
});
