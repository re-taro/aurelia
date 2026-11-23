import { describe, expect, test } from 'vitest';

import { MediaQuery } from './breakpoint';
import {
	defineResponsiveTokens,
	isResponsiveObject,
	mapResponsiveOverrides,
	type ResponsiveValue,
	type TokenValue,
} from './responsive';

describe('responsive', () => {
	describe('isResponsiveObject', () => {
		test.each<{ input: ResponsiveValue<TokenValue>; expected: boolean }>([
			{ input: '80vw', expected: false },
			{ input: { base: '80vw' }, expected: true },
			{ input: { base: '80vw', desktop: '60vw' }, expected: true },
			{ input: { fontSize: '1rem', lineHeight: '1.5' }, expected: false },
			{ input: {}, expected: false },
		])('isResponsiveObject(%s) = %s', ({ input, expected }) => {
			expect(isResponsiveObject(input)).toBe(expected);
		});
	});

	describe('defineResponsiveTokens', () => {
		test('breakpoint 指定のない値は base のみになる', () => {
			expect(defineResponsiveTokens({ maxH: '100svh' })).toStrictEqual({
				base: { maxH: '100svh' },
				overrides: {},
			});
		});

		test('上書きのない breakpoint は overrides に現れない', () => {
			expect(defineResponsiveTokens({ maxW: { base: '80vw', tablet: '60vw' } })).toStrictEqual({
				base: { maxW: '80vw' },
				overrides: { tablet: { maxW: '60vw' } },
			});
		});

		test('上書きのない token はより狭い breakpoint の値で埋められる', () => {
			expect(
				defineResponsiveTokens({
					maxW: { base: '80vw', mobile: '94vw' },
					maxH: { base: '100svh', desktop: '80svh' },
				}),
			).toStrictEqual({
				base: { maxW: '80vw', maxH: '100svh' },
				overrides: {
					mobile: { maxW: '94vw', maxH: '100svh' },
					desktop: { maxW: '94vw', maxH: '80svh' },
				},
			});
		});
	});

	describe('mapResponsiveOverrides', () => {
		test('media query をキーに、狭い breakpoint から順に並ぶ', () => {
			const tokens = defineResponsiveTokens({
				maxW: { base: '80vw', desktop: '60vw', mobile: '94vw' },
			});

			const mapped = mapResponsiveOverrides(tokens, (values, breakpoint) => ({ breakpoint, values }));

			expect(Object.keys(mapped)).toStrictEqual([MediaQuery.MOBILE, MediaQuery.DESKTOP]);
			expect(mapped).toStrictEqual({
				[MediaQuery.MOBILE]: { breakpoint: 'mobile', values: { maxW: '94vw' } },
				[MediaQuery.DESKTOP]: { breakpoint: 'desktop', values: { maxW: '60vw' } },
			});
		});
	});
});
