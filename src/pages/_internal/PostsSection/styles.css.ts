import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '../../../foundation/styles/tokens';

export const section = style({
	display: 'flex',
	flexDirection: 'column',
	rowGap: calc.multiply(vars.space, 3),
	paddingTop: calc.multiply(vars.space, 2),
});
