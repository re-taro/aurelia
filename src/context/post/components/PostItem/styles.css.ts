import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '../../../../foundation/styles/tokens';
import { MediaQuery } from '../../../../foundation/styles/tokens/breakpoint';

export const a = style({
	...vars.typography['normal.7'],
	display: 'grid',
	gridTemplateColumns: 'auto 1fr',
	alignItems: 'baseline',
	columnGap: calc.multiply(vars.space, 1),
	padding: `${calc.multiply(vars.space, 1)} 0`,
	color: vars.color['mono.a'],
	':active': {
		color: vars.color['mono.a.hover'],
	},
	'@media': {
		[MediaQuery.HOVER]: {
			':hover': {
				color: vars.color['mono.a.hover'],
			},
		},
	},
});
