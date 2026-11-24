import type { EnumLike } from '../../utils/TypeUtils';

export const BreakPoint = {
	MOBILE: 560,
	TABLET: 1024,
	DESKTOP: 1216,
} as const;
export type BreakPoint = EnumLike<typeof BreakPoint>;

export const MediaQuery = {
	MOBILE: `(width >= ${BreakPoint.MOBILE}px)`,
	TABLET: `(width >= ${BreakPoint.TABLET}px)`,
	DESKTOP: `(width >= ${BreakPoint.DESKTOP}px)`,
	HOVER: '(hover: hover) and (pointer: fine)',
	REDUCED_MOTION: '(prefers-reduced-motion: reduce)',
	MORE_CONTRAST: '(prefers-contrast: more)',
} as const;
export type MediaQuery = EnumLike<typeof MediaQuery>;
