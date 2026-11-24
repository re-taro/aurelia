import { describe, expectTypeOf, test } from 'vitest';

import type { DotCaseKeys, EnumLike } from './TypeUtils';

describe('TypeUtils', () => {
	test('DotCaseKeys', () => {
		expectTypeOf<DotCaseKeys<{ user_name: string }>>().toEqualTypeOf<{ 'user.name': string }>();
	});

	describe('EnumLike', () => {
		test('リテラル値のユニオンになる', () => {
			expectTypeOf<EnumLike<{ readonly MOBILE: 560; readonly TABLET: 1024 }>>().toEqualTypeOf<560 | 1024>();
			expectTypeOf<EnumLike<{ readonly HOVER: '(hover: hover)'; readonly TABLET: 1024 }>>().toEqualTypeOf<
				'(hover: hover)' | 1024
			>();
			expectTypeOf<EnumLike<{ readonly MOBILE: 560 }>>().toEqualTypeOf<560>();
		});

		test('as const を忘れて widen された場合は never になる', () => {
			expectTypeOf<EnumLike<{ MOBILE: number }>>().toEqualTypeOf<never>();
			expectTypeOf<EnumLike<{ HOVER: string }>>().toEqualTypeOf<never>();
		});

		test('1 つでも widen されていれば never になる', () => {
			expectTypeOf<EnumLike<{ readonly MOBILE: 560; TABLET: number }>>().toEqualTypeOf<never>();
			expectTypeOf<EnumLike<{ readonly HOVER: '(hover: hover)'; REDUCED_MOTION: string }>>().toEqualTypeOf<never>();
		});
	});
});
