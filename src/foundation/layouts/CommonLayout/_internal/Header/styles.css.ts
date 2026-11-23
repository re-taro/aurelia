import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '../../../../styles/tokens';

export const header = style({
	position: 'sticky',
	isolation: 'isolate',
	padding: calc.multiply(vars.space, 1),
});

export const nav = style({
	width: '100%',
	maxWidth: vars.layout.maxW,
	margin: '0 auto',
});

export const list = style({
	display: 'flex',
	rowGap: calc.multiply(vars.space, 1),
	width: '100%',
});

export const listItem = style({
	display: 'flex',
	alignItems: 'center',
	width: 'fit-content',
	selectors: {
		[`${list} > &:first-child`]: {
			flex: 1,
		},
	},
});

export const logo = style({
	...vars.typography['dense.5'],
	fontWeight: 'bold',
});
