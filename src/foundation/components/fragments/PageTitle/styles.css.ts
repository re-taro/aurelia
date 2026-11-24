import { style } from '@vanilla-extract/css';

import { vars } from '../../../styles/tokens';

export const h1 = style({
	...vars.typography['dense.4'],
	fontWeight: 'bold',
});
