import { describe, expect, test } from 'vitest';

import { normalizeTag } from './services';

describe('services', () => {
	describe('normalizeTag', () => {
		test('英小文字と数字のみのタグはそのまま返す', () => {
			expect(normalizeTag('astro5')).toBe('astro5');
		});

		test('大文字を小文字に変換する', () => {
			expect(normalizeTag('TypeScript')).toBe('typescript');
		});

		test('英数字以外の文字をハイフンに置換する', () => {
			expect(normalizeTag('next.js')).toBe('next-js');
			expect(normalizeTag('c++')).toBe('c--');
			expect(normalizeTag('Web Components')).toBe('web-components');
		});

		test('連続する記号は 1 文字ずつハイフンに置換する', () => {
			expect(normalizeTag('a  b')).toBe('a--b');
		});

		test('非 ASCII 文字はコードポイント単位でハイフンに置換する', () => {
			expect(normalizeTag('日記')).toBe('--');
			expect(normalizeTag('🎉')).toBe('-');
		});

		test('空文字列は空文字列を返す', () => {
			expect(normalizeTag('')).toBe('');
		});

		test('冪等である', () => {
			const once = normalizeTag('Next.js 15');

			expect(normalizeTag(once)).toBe(once);
		});
	});
});
