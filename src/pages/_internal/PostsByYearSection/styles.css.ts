import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '../../../foundation/styles/tokens';
import { MediaQuery } from '../../../foundation/styles/tokens/breakpoint';

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	rowGap: calc.multiply(vars.space, 1),
});

export const h2 = style({
	...vars.typography['dense.5'],
	fontWeight: 'bold',
});
export const hash = style({
	'::before': {
		content: '## ',
		color: vars.color.brand,
	},
	selectors: {
		'&::before:active': {
			color: vars.color['brand.hover'],
		},
		'&::before:hover': {
			'@media': {
				[MediaQuery.HOVER]: {
					color: vars.color['brand.hover'],
				},
			},
		},
	},
});
