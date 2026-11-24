import { style } from '@vanilla-extract/css';

import { vars } from '../../../styles/tokens';
import { MediaQuery } from '../../../styles/tokens/breakpoint';

export const a = style({
	color: vars.color.brand,
	':active': {
		color: vars.color['brand.hover'],
	},
	'@media': {
		[MediaQuery.HOVER]: {
			':hover': {
				color: vars.color['brand.hover'],
			},
		},
	},
});
