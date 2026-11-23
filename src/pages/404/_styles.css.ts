import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '../../foundation/styles/tokens';

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	rowGap: calc.multiply(vars.space, 1),
	paddingTop: calc.multiply(vars.space, 2),
});

export const h2 = style({
	...vars.typography['dense.5'],
	fontWeight: 'bold',
});
