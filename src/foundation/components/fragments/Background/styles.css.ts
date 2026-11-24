import { style } from '@vanilla-extract/css';

import { MediaQuery } from '../../../styles/tokens/breakpoint';

export const root = style({
	position: 'fixed',
	top: 0,
	right: 0,
	left: 0,
	// モバイルでツールバーが出入りしても canvas がリサイズされて伸びないよう、最大のビューポート高に固定する
	height: '100lvh',
	zIndex: -1,
	display: 'block',
	pointerEvents: 'none',
	'@media': {
		[MediaQuery.MORE_CONTRAST]: {
			display: 'none',
		},
	},
});

export const canvas = style({
	display: 'block',
	width: '100%',
	height: '100%',
});
