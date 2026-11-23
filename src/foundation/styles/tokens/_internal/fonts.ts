// ブラウザデフォルトの 16px をベースにする
const baseSize = '1rem';
export const tSize = {
	1: `calc(${baseSize} * 8 / 1)`,
	2: `calc(${baseSize} * 8 / 2)`,
	3: `calc(${baseSize} * 8 / 3)`,
	4: `calc(${baseSize} * 8 / 4)`,
	5: `calc(${baseSize} * 8 / 5)`,
	6: `calc(${baseSize} * 8 / 6)`,
	7: `calc(${baseSize} * 8 / 7)`,
	8: `calc(${baseSize} * 8 / 8)`,
	9: `calc(${baseSize} * 8 / 9)`,
	10: `calc(${baseSize} * 8 / 10)`,
} as const;

export const tHeight = {
	COMFORT: '1.8',
	NORMAL: '1.5',
	DENSE: '1.2',
} as const;
