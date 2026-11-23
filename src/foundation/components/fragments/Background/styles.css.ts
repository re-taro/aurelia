import { style } from '@vanilla-extract/css';

import { MediaQuery } from '../../../styles/tokens/breakpoint';

export const root = style({
	position: 'fixed',
	inset: 0,
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
