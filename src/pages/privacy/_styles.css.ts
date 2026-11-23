import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '../../foundation/styles/tokens';

export const section = style({
	paddingTop: calc.multiply(vars.space, 2),
});

export const ul = style({
	listStyle: 'inside',
});
