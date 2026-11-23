import { describe, expect, test } from 'vitest';

import { createPost } from './factories';
import { groupPostsByYear } from './services';

describe('services', () => {
	describe('groupPostsByYear', () => {
		test('空配列を渡すと空配列を返す', () => {
			expect(groupPostsByYear([])).toStrictEqual([]);
		});

		test('publishedAt の年ごとにグループ化する', () => {
			const post2024a = createPost({ id: '2024-a', data: { publishedAt: '2024-01-05T00:00:00+09:00[Asia/Tokyo]' } });
			const post2024b = createPost({ id: '2024-b', data: { publishedAt: '2024-06-01T00:00:00+09:00[Asia/Tokyo]' } });
			const post2023 = createPost({ id: '2023-a', data: { publishedAt: '2023-12-31T00:00:00+09:00[Asia/Tokyo]' } });

			const result = groupPostsByYear([post2024a, post2024b, post2023]);

			expect(result).toStrictEqual([
				{ year: 2024, posts: [post2024a, post2024b] },
				{ year: 2023, posts: [post2023] },
			]);
		});

		test('年は新しい順に並ぶ', () => {
			const post2022 = createPost({ id: '2022-a', data: { publishedAt: '2022-03-01T00:00:00+09:00[Asia/Tokyo]' } });
			const post2024 = createPost({ id: '2024-a', data: { publishedAt: '2024-03-01T00:00:00+09:00[Asia/Tokyo]' } });
			const post2023 = createPost({ id: '2023-a', data: { publishedAt: '2023-03-01T00:00:00+09:00[Asia/Tokyo]' } });

			const result = groupPostsByYear([post2022, post2024, post2023]);

			expect(result.map((group) => group.year)).toStrictEqual([2024, 2023, 2022]);
		});

		test('同じ年のグループ内では入力の順序を保持する', () => {
			const later = createPost({ id: 'later', data: { publishedAt: '2024-12-01T00:00:00+09:00[Asia/Tokyo]' } });
			const earlier = createPost({ id: 'earlier', data: { publishedAt: '2024-01-01T00:00:00+09:00[Asia/Tokyo]' } });

			const result = groupPostsByYear([later, earlier]);

			expect(result).toStrictEqual([{ year: 2024, posts: [later, earlier] }]);
		});

		test('オフセットのみの文字列は Asia/Tokyo に変換した年でグループ化する', () => {
			// 2023-12-31T23:00:00Z == 2024-01-01T08:00:00+09:00
			const post = createPost({ id: 'boundary', data: { publishedAt: '2023-12-31T23:00:00Z' } });

			const result = groupPostsByYear([post]);

			expect(result).toStrictEqual([{ year: 2024, posts: [post] }]);
		});

		test('タイムゾーン注釈付きの文字列は注釈のタイムゾーンの年でグループ化する', () => {
			// UTC では 2023 年のまま
			const post = createPost({ id: 'annotated', data: { publishedAt: '2023-12-31T23:00:00+00:00[UTC]' } });

			const result = groupPostsByYear([post]);

			expect(result).toStrictEqual([{ year: 2023, posts: [post] }]);
		});
	});
});
