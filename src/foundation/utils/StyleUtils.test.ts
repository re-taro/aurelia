import { describe, expect, test } from 'vitest';

import { alpha, dotCaseKeys } from './StyleUtils';

describe('StyleUtils', () => {
	test.each([
		{
			input: { COMFORT_7: { fontSize: '0.4375rem' }, fooBar: 1 },
			expected: { 'comfort.7': { fontSize: '0.4375rem' }, 'foo.bar': 1 },
		},
		{
			input: {},
			expected: {},
		},
		{
			input: { fooBar: 1, foo_bar: 2 },
			expected: { 'foo.bar': 2 },
		},
	])('dotCaseKeys(%s) = %s', ({ input, expected }) => {
		expect(dotCaseKeys(input)).toStrictEqual(expected);
	});

	test.each([
		{
			color: 'oklch(0.722 0.177 305.504)',
			value: 0.5,
			expected: 'oklch(from oklch(0.722 0.177 305.504) l c h / 0.5)',
		},
		{
			color: 'var(--aurelia-color-brand)',
			value: 1,
			expected: 'oklch(from var(--aurelia-color-brand) l c h / 1)',
		},
	])('alpha($color, $value) = $expected', ({ color, value, expected }) => {
		expect(alpha(color, value)).toBe(expected);
	});
});
