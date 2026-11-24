import { style, styleVariants } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { drawerOpenSelector, drawerWidth } from '../../../../../foundation/styles/drawer.css';
import { vars } from '../../../../../foundation/styles/tokens';
import { MediaQuery } from '../../../../../foundation/styles/tokens/breakpoint';
import { alpha } from '../../../../../foundation/utils/StyleUtils';

export const button = style({
	font: 'inherit',
	color: vars.color.brand,
	background: 'none',
	border: 0,
	padding: 0,
	cursor: 'pointer',
	'::before': {
		content: '[ ',
	},
	'::after': {
		content: ' ]',
	},
	':active': {
		color: vars.color['brand.hover'],
	},
	'@media': {
		[MediaQuery.HOVER]: {
			':hover': {
				color: vars.color['brand.hover'],
			},
		},
	},
});

export const label = styleVariants({
	open: {
		selectors: {
			[`${drawerOpenSelector} &`]: {
				display: 'none',
			},
		},
	},
	close: {
		display: 'none',
		selectors: {
			[`${drawerOpenSelector} &`]: {
				display: 'inline',
			},
		},
	},
});

export const nav = style({
	position: 'fixed',
	inset: '0 0 0 auto',
	boxSizing: 'border-box',
	width: drawerWidth,
	height: '100dvh',
	margin: 0,
	border: 0,
	padding: calc.multiply(vars.space, 2),
	color: vars.color['mono.a'],
	background: alpha(vars.color['mono.50'], 0.8),
	backdropFilter: 'blur(8px)',
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	translate: '100% 0',
	opacity: 0,
	transition: 'translate 0.3s ease, opacity 0.3s ease, display 0.3s allow-discrete, overlay 0.3s allow-discrete',
	selectors: {
		'&:popover-open': {
			translate: '0 0',
			opacity: 1,
		},
	},
	'@media': {
		[MediaQuery.REDUCED_MOTION]: {
			transition: 'none',
		},
	},
});

export const ol = style({
	display: 'flex',
	flexDirection: 'column',
	rowGap: calc.multiply(vars.space, 0.5),
});

export const li = styleVariants({
	0: {},
	1: { paddingLeft: calc.multiply(vars.space, 2) },
	2: { paddingLeft: calc.multiply(vars.space, 4) },
});

export const a = style({
	display: 'block',
	overflowWrap: 'anywhere',
	':active': {
		color: vars.color['brand.hover'],
	},
	'@media': {
		[MediaQuery.HOVER]: {
			':hover': {
				color: vars.color.brand,
			},
		},
	},
});

export const hash = style({
	color: vars.color['mono.90'],
	paddingRight: calc.multiply(vars.space, 0.5),
});
