import { globalStyle, style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { drawerOpenSelector, drawerWidth } from '../../styles/drawer.css';
import { vars } from '../../styles/tokens';
import { MediaQuery } from '../../styles/tokens/breakpoint';

export const body = style({
	minHeight: '100svh',
});

export const page = style({
	minHeight: '100svh',
	display: 'grid',
	gridTemplateRows: 'auto 1fr auto',
	transition: 'translate 0.3s ease, opacity 0.3s ease',
	'@media': {
		[MediaQuery.REDUCED_MOTION]: {
			transition: 'none',
		},
	},
});

globalStyle(`${drawerOpenSelector} ${page}`, {
	translate: `calc(-1 * ${drawerWidth}) 0`,
	opacity: 0.4,
	pointerEvents: 'none',
	userSelect: 'none',
});

export const main = style({
	width: '100%',
	maxWidth: vars.layout.maxW,
	margin: `${calc.multiply(vars.space, 1)} auto`,
	isolation: 'isolate',
});
