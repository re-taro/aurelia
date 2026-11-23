import { describe, expect, test } from 'vitest';

import { compareZonedDateTime, formatDate, parseZonedDateTime } from './DateUtils';

// 2024-01-05 00:00:00 Asia/Tokyo
const BASE_EPOCH_MS = 1_704_380_400_000;

describe('DateUtils', () => {
	describe('parseZonedDateTime', () => {
		test('タイムゾーン注釈付きの文字列は注釈のタイムゾーンで解釈する', () => {
			const result = parseZonedDateTime('2024-01-05T00:00:00+09:00[Asia/Tokyo]');

			expect(result.timeZoneId).toBe('Asia/Tokyo');
			expect(result.epochMilliseconds).toBe(BASE_EPOCH_MS);
		});

		test('Asia/Tokyo 以外の注釈もそのまま保持する', () => {
			const result = parseZonedDateTime('2024-01-04T15:00:00+00:00[UTC]');

			expect(result.timeZoneId).toBe('UTC');
			expect(result.epochMilliseconds).toBe(BASE_EPOCH_MS);
		});

		test.each([
			{ input: '2024-01-04T15:00:00Z' },
			{ input: '2024-01-05T00:00:00+09:00' },
			{ input: '2024-01-04T10:00:00-05:00' },
		])('オフセットのみの文字列 ($input) はその瞬間を Asia/Tokyo に変換する', ({ input }) => {
			const result = parseZonedDateTime(input);

			expect(result.timeZoneId).toBe('Asia/Tokyo');
			expect(result.epochMilliseconds).toBe(BASE_EPOCH_MS);
		});

		test.each([
			{ input: '2024-01-05', expected: BASE_EPOCH_MS },
			{ input: '2024-01-05T10:30', expected: BASE_EPOCH_MS + (10 * 3600 + 30 * 60) * 1000 },
		])('オフセットを持たない文字列 ($input) は Asia/Tokyo の壁時計時刻として解釈する', ({ input, expected }) => {
			const result = parseZonedDateTime(input);

			expect(result.timeZoneId).toBe('Asia/Tokyo');
			expect(result.epochMilliseconds).toBe(expected);
		});

		test.each([{ input: '' }, { input: 'こんにちは' }, { input: '2024-02-30' }])(
			'パースできない文字列 ($input) は RangeError を throw する',
			({ input }) => {
				expect(() => parseZonedDateTime(input)).toThrow(RangeError);
			},
		);
	});

	describe('formatDate', () => {
		test.each([
			{ input: '2024-01-05T00:00:00+09:00[Asia/Tokyo]', key: 'MM-DD', expected: '01-05' },
			{ input: '2024-12-31T23:59:59+09:00[Asia/Tokyo]', key: 'MM-DD', expected: '12-31' },
			{ input: '2024-01-05T00:00:00+09:00[Asia/Tokyo]', key: 'YYYY-MM-DD', expected: '2024-01-05' },
		] as const)('$key 形式に整形する ($input)', ({ input, key, expected }) => {
			expect(formatDate(parseZonedDateTime(input), key)).toBe(expected);
		});

		test('値が持つタイムゾーンの壁時計時刻で整形する', () => {
			expect(formatDate(parseZonedDateTime('2024-01-04T15:00:00+00:00[UTC]'), 'MM-DD')).toBe('01-04');
		});
	});

	describe('compareZonedDateTime', () => {
		const earlier = parseZonedDateTime('2024-01-05T00:00:00+09:00[Asia/Tokyo]');
		const later = parseZonedDateTime('2024-01-06T00:00:00+09:00[Asia/Tokyo]');

		test.each([
			{ a: earlier, b: later, expected: -1, label: 'a が過去なら -1' },
			{ a: later, b: earlier, expected: 1, label: 'a が未来なら 1' },
			{ a: earlier, b: earlier, expected: 0, label: '同じ瞬間なら 0' },
		])('asc: $label', ({ a, b, expected }) => {
			expect(compareZonedDateTime(a, b, 'asc')).toBe(expected);
		});

		test.each([
			{ a: earlier, b: later, expected: 1, label: 'a が過去なら 1' },
			{ a: later, b: earlier, expected: -1, label: 'a が未来なら -1' },
			{ a: earlier, b: earlier, expected: 0, label: '同じ瞬間なら 0' },
		])('desc: $label', ({ a, b, expected }) => {
			expect(compareZonedDateTime(a, b, 'desc')).toBe(expected);
		});

		test('タイムゾーンが違っても同じ瞬間なら 0 を返す', () => {
			const utc = parseZonedDateTime('2024-01-04T15:00:00+00:00[UTC]');

			expect(compareZonedDateTime(earlier, utc, 'asc')).toBe(0);
			expect(compareZonedDateTime(earlier, utc, 'desc')).toBe(0);
		});

		test('sort に渡すと desc で新しい順に並ぶ', () => {
			const middle = parseZonedDateTime('2024-01-05T12:00:00+09:00[Asia/Tokyo]');
			const sorted = [middle, earlier, later].toSorted((a, b) => compareZonedDateTime(a, b, 'desc'));

			expect(sorted).toStrictEqual([later, middle, earlier]);
		});
	});
});
