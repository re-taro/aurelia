import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '../../../../styles/tokens';

export const footer = style({
	position: 'sticky',
	isolation: 'isolate',
	padding: calc.multiply(vars.space, 1),
});

export const p = style({
	...vars.typography['normal.10'],
	width: '100%',
	maxWidth: vars.layout.maxW,
	margin: '0 auto',
});
