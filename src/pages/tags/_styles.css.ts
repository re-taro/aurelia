import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '../../foundation/styles/tokens';
import { MediaQuery } from '../../foundation/styles/tokens/breakpoint';

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	rowGap: calc.multiply(vars.space, 1),
	paddingTop: calc.multiply(vars.space, 2),
});

export const ul = style({
	display: 'flex',
	flexWrap: 'wrap',
});

export const li = style({
	whiteSpace: 'nowrap',
	selectors: {
		'&:first-child::before': {
			content: '[ ',
		},
		'&:last-child::after': {
			content: ' ]',
		},
	},
});

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
	selectors: {
		[`${li}:not(:last-child) > &::after`]: {
			content: ',',
			paddingRight: calc.multiply(vars.space, 0.5),
		},
	},
});
