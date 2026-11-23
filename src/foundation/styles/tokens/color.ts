import { alpha, dotCaseKeys } from '../../utils/StyleUtils';

import { DarkPalette } from './_internal/palettes';

export const Color = {
	MONO_A: DarkPalette.GRAY_A,
	MONO_A_HOVER: DarkPalette.GRAY_90,
	MONO_50: DarkPalette.GRAY_50,
	MONO_50_HOVER: DarkPalette.GRAY_70,
	MONO_90: DarkPalette.GRAY_90,

	BRAND: DarkPalette.VIOLET_50,
	BRAND_ALPHA: alpha(DarkPalette.VIOLET_50, 0.5),
	BRAND_HOVER: DarkPalette.VIOLET_70,
} as const;

export const colorMap = dotCaseKeys(Color);
