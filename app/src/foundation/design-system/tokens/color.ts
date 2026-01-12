import { Palette } from "./-internal/palettes";

export const Color = {
	MONO_A: Palette.GRAY_50,
	MONO_5: Palette.GRAY_100,
	MONO_10: Palette.GRAY_200,
	MONO_20: Palette.GRAY_300,
	MONO_30: Palette.GRAY_400,
	MONO_40: Palette.GRAY_500,
	MONO_50: Palette.GRAY_600,
	MONO_60: Palette.GRAY_700,
	MONO_70: Palette.GRAY_800,
	MONO_80: Palette.GRAY_900,

	BRAND: Palette.PURPLE_300,
	BRAND_HOVER: Palette.PURPLE_200,
} as const;
