import { tHeight, tSize } from "./-internal/fonts";

export const Typography = {
	COMFORT42: `font-size: ${tSize[3]}; line-height: ${tHeight.COMFORT}; letter-spacing: 0;`,
	COMFORT26: `font-size: ${tSize[5]}; line-height: ${tHeight.COMFORT}; letter-spacing: 0;`,
	COMFORT20: `font-size: ${tSize[6]}; line-height: ${tHeight.COMFORT}; letter-spacing: 0;`,
	COMFORT18: `font-size: ${tSize[7]}; line-height: ${tHeight.COMFORT}; letter-spacing: 0;`,

	NORMAL42: `font-size: ${tSize[3]}; line-height: ${tHeight.NORMAL}; letter-spacing: 0;`,
	NORMAL26: `font-size: ${tSize[5]}; line-height: ${tHeight.NORMAL}; letter-spacing: 0;`,
	NORMAL20: `font-size: ${tSize[6]}; line-height: ${tHeight.NORMAL}; letter-spacing: 0;`,
	NORMAL18: `font-size: ${tSize[7]}; line-height: ${tHeight.NORMAL}; letter-spacing: 0;`,
	NORMAL16: `font-size: ${tSize[8]}; line-height: ${tHeight.NORMAL}; letter-spacing: 0;`,
	NORMAL12: `font-size: ${tSize[10]}; line-height: ${tHeight.NORMAL}; letter-spacing: 0;`,
	NORMAL10: `font-size: ${tSize[12]}; line-height: ${tHeight.NORMAL}; letter-spacing: 0;`,

	DENSE16: `font-size: ${tSize[8]}; line-height: ${tHeight.DENSE}; letter-spacing: 0;`,
	DENSE12: `font-size: ${tSize[10]}; line-height: ${tHeight.DENSE}; letter-spacing: 0;`,
	DENSE10: `font-size: ${tSize[12]}; line-height: ${tHeight.DENSE}; letter-spacing: 0;`,
} as const;

export type VariantKey = Lowercase<keyof typeof Typography> | 'inherit';

export const variantMap = Object.entries(Typography).reduce<Partial<Record<VariantKey, string>>>(
  (acc, [key, value]) => {
	acc[key.toLowerCase() as VariantKey] = value;

	return acc;
  },
  {
		inherit: 'font-size: inherit; letter-spacing: inherit; line-height: inherit;',
  },
) as Record<VariantKey, string>;
