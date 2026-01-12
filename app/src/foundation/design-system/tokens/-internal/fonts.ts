// NOTE: https://standard.shiftbrain.com/blog/music-math-typography

export const tSize = {
	1: 'calc(1 * 8 / 1)rem',
	2: 'calc(1 * 8 / 2)rem',
	3: 'calc(1 * 8 / 3)rem',
	4: 'calc(1 * 8 / 4)rem',
	5: 'calc(1 * 8 / 5)rem',
	6: 'calc(1 * 8 / 6)rem',
	7: 'calc(1 * 8 / 7)rem',
	8: 'calc(1 * 8 / 8)rem',
	9: 'calc(1 * 8 / 9)rem',
	10: 'calc(1 * 8 / 10)rem',
	11: 'calc(1 * 8 / 11)rem',
	12: 'calc(1 * 8 / 12)rem',
} as const;

const LineHeightUnit = 0.25;

export const tHeight = {
	COMFORT: `calc(${LineHeightUnit} * 6)rem`,
	NORMAL: `calc(${LineHeightUnit} * 5)rem`,
	DENSE: `calc(${LineHeightUnit} * 4)rem`,
} as const;
