import { style } from '@vanilla-extract/css';

import { MediaQuery } from '../../../../../foundation/styles/tokens/breakpoint';

export const img = style({
	height: 'auto',
	width: '100%',
	maxWidth: '100%',
	'@media': {
		[MediaQuery.MOBILE]: {
			maxWidth: '50vw',
		},
	},
});
