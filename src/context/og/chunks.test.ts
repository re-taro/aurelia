import { describe, expect, test } from 'vitest';

import { toChunks } from './chunks';

describe('toChunks', () => {
	test('日本語を文節で分ける', () => {
		expect(toChunks('React Compilerの eslintSuppressionRules を考察してみる')).toStrictEqual([
			'React Compilerの ',
			'eslintSuppressionRules を',
			'考察してみる',
		]);
	});

	test('文節の先頭の空白を直前の文節へ移す', () => {
		expect(toChunks('@re-taro のブログ。 web エコシステム')).toStrictEqual([
			'@re-taro の',
			'ブログ。 ',
			'web エコシステム',
		]);
	});

	test('空文字は空配列になる', () => {
		expect(toChunks('')).toStrictEqual([]);
	});
});
