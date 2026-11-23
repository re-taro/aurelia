import { dotCaseKeys } from '../../utils/StyleUtils';

import { tHeight, tSize } from './_internal/fonts';

type FontStyleValue<S extends keyof typeof tSize, H extends keyof typeof tHeight> = {
	fontSize: (typeof tSize)[S];
	lineHeight: (typeof tHeight)[H];
	letterSpacing: string;
};

const def = <S extends keyof typeof tSize, H extends keyof typeof tHeight>(
	size: S,
	height: H,
	letterSpacing = 'normal',
): FontStyleValue<S, H> => ({
	fontSize: tSize[size],
	lineHeight: tHeight[height],
	letterSpacing,
});

export const Typography = {
	COMFORT_7: def(7, 'COMFORT', '0'),
	COMFORT_8: def(8, 'COMFORT', '0'),

	NORMAL_5: def(5, 'NORMAL', '0'),
	NORMAL_7: def(7, 'NORMAL', '0'),
	NORMAL_8: def(8, 'NORMAL', '0'),
	NORMAL_10: def(10, 'NORMAL', '0'),

	DENSE_4: def(4, 'DENSE', '-0.005em'),
	DENSE_5: def(5, 'DENSE', '0'),
	DENSE_7: def(7, 'DENSE', '0'),
	DENSE_8: def(8, 'DENSE', '0'),
	DENSE_10: def(10, 'DENSE', '0'),
} as const;

export const typographyMap = dotCaseKeys(Typography);
