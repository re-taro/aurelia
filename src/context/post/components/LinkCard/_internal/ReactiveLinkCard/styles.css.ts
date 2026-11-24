import { keyframes, style, type StyleRule } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '../../../../../../foundation/styles/tokens';
import { MediaQuery } from '../../../../../../foundation/styles/tokens/breakpoint';

const lineClamp = (lines: number): StyleRule => ({
	display: '-webkit-box',
	// oxlint-disable-next-line typescript/no-deprecated
	WebkitBoxOrient: 'vertical',
	WebkitLineClamp: lines,
	overflow: 'hidden',
});

export const card = style({
	display: 'flex',
	alignItems: 'center',
	height: '128px',
	margin: `${calc.multiply(vars.space, 3)} 0`,
	overflow: 'hidden',
	border: `1px solid ${vars.color['mono.50.hover']}`,
	background: vars.color['mono.50'],
	color: vars.color['mono.a'],
	':active': {
		color: vars.color['mono.a'],
		background: vars.color['mono.50.hover'],
	},
	'@media': {
		[MediaQuery.HOVER]: {
			':hover': {
				color: vars.color['mono.a'],
				background: vars.color['mono.50.hover'],
			},
		},
	},
});

export const body = style({
	display: 'grid',
	flexGrow: 1,
	minWidth: 0,
	rowGap: calc.multiply(vars.space, 0.5),
	padding: calc.multiply(vars.space, 2),
});

export const title = style({
	...vars.typography['dense.8'],
	...lineClamp(2),
	fontWeight: 'bold',
});

export const description = style({
	...vars.typography['dense.10'],
	...lineClamp(2),
	color: vars.color['mono.90'],
});

export const meta = style({
	...vars.typography['dense.10'],
	display: 'flex',
	alignItems: 'center',
	minWidth: 0,
	columnGap: calc.multiply(vars.space, 0.5),
	color: vars.color['mono.90'],
});

export const favicon = style({
	flexShrink: 0,
	width: calc.multiply(vars.space, 2),
	height: calc.multiply(vars.space, 2),
});

export const hostname = style({
	overflow: 'hidden',
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
});

export const image = style({
	flexShrink: 0,
	height: '100%',
	width: 'auto',
	aspectRatio: '1 / 1',
	objectFit: 'cover',
	borderLeft: `1px solid ${vars.color['mono.50.hover']}`,
	background: vars.color['mono.50.hover'],
});

export const imageLarge = style({
	'@media': {
		[MediaQuery.MOBILE]: {
			aspectRatio: '40 / 21',
		},
	},
});

const pulse = keyframes({
	'0%, 100%': { opacity: 1 },
	'50%': { opacity: 0.4 },
});

export const placeholder = style({
	display: 'block',
	height: '1em',
	borderRadius: calc.multiply(vars.space, 0.5),
	background: vars.color['mono.50.hover'],
	animation: `${pulse} 1.5s ease-in-out infinite`,
	'@media': {
		[MediaQuery.REDUCED_MOTION]: {
			animation: 'none',
		},
	},
});

export const placeholderTitle = style([placeholder, { ...vars.typography['dense.8'], width: '100%' }]);

export const placeholderDescription = style([placeholder, { ...vars.typography['dense.10'], width: '50%' }]);

export const placeholderMeta = style([placeholder, { ...vars.typography['dense.10'], width: '25%' }]);
