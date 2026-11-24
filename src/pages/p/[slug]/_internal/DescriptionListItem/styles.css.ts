import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '../../../../../foundation/styles/tokens';

export const div = style({
	display: 'flex',
	flexWrap: 'nowrap',
});

export const dt = style({
	fontWeight: 'bold',
	'::after': {
		content: ':',
		paddingRight: calc.multiply(vars.space, 0.5),
	},
});
