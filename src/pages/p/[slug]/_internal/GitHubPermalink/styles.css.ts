import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '../../../../../foundation/styles/tokens';

export const figure = style({
	display: 'flex',
	flexDirection: 'column',
	rowGap: calc.multiply(vars.space, 0.5),
	margin: `${calc.multiply(vars.space, 2)} 0`,
});

export const caption = style({
	...vars.typography['dense.8'],
	textAlign: 'right',
});
