import { globalStyle, style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '../../../foundation/styles/tokens';
import { MediaQuery } from '../../../foundation/styles/tokens/breakpoint';

const ORDER_LIST_COUNTER = 'order';

export const article = style({
	display: 'flex',
	flexDirection: 'column',
	rowGap: calc.multiply(vars.space, 0.5),
});

export const markdown = style({
	paddingTop: calc.multiply(vars.space, 3),
	overflowWrap: 'anywhere',
});

// heading
globalStyle(`:where(${markdown}) :is(h2, h3, h4, h5, h6)`, {
	fontWeight: 'bold',
});
globalStyle(`:where(${markdown}) h2`, {
	...vars.typography['dense.5'],
	margin: `${calc.multiply(vars.space, 2.5)} 0`,
});
globalStyle(`:where(${markdown}) h2 > a::before`, {
	content: '## ',
});
globalStyle(`:where(${markdown}) :is(h3, h4, h5, h6)`, {
	...vars.typography['comfort.7'],
	margin: `${calc.multiply(vars.space, 2.125)} 0`,
});
globalStyle(`:where(${markdown}) h3 > a::before`, {
	content: '### ',
});
globalStyle(`:where(${markdown}) h4 > a::before`, {
	content: '#### ',
});
globalStyle(`:where(${markdown}) h5 > a::before`, {
	content: '##### ',
});
globalStyle(`:where(${markdown}) h6 > a::before`, {
	content: '###### ',
});

// anchor
globalStyle(`:where(${markdown}) a`, {
	color: vars.color.brand,
});
globalStyle(`:where(${markdown}) a:active`, {
	color: vars.color['brand.hover'],
});
globalStyle(`:where(${markdown}) a:hover`, {
	'@media': {
		[MediaQuery.HOVER]: {
			color: vars.color['brand.hover'],
		},
	},
});

// paragraph
globalStyle(`:where(${markdown}) p`, {
	...vars.typography['comfort.8'],
	margin: `${calc.multiply(vars.space, 2)} 0`,
});

// code
globalStyle(`:where(${markdown}) > code`, {
	fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace',
});
globalStyle(`:where(${markdown}) > code::before`, {
	content: '`',
});
globalStyle(`:where(${markdown}) > code::after`, {
	content: '`',
});

// superscript
globalStyle(`:where(${markdown}) sup`, {
	...vars.typography['normal.10'],
	verticalAlign: 'top',
});

// list
globalStyle(`:where(${markdown}) > :is(ul, ol)`, {
	margin: `${calc.multiply(vars.space, 2)} 0`,
});
globalStyle(`:where(${markdown}) li > :is(ul, ol)`, {
	paddingLeft: calc.multiply(vars.space, 2),
});
globalStyle(`:where(${markdown}) ol`, {
	counterReset: `${ORDER_LIST_COUNTER} 0`,
});
globalStyle(`:where(${markdown}) ul > li::before`, {
	content: '- ',
});
globalStyle(`:where(${markdown}) ol > li`, {
	counterIncrement: ORDER_LIST_COUNTER,
});
globalStyle(`:where(${markdown}) ol > li::before`, {
	content: `counter(${ORDER_LIST_COUNTER}) '. '`,
});
globalStyle(`:where(${markdown}) li > p:first-child`, {
	display: 'inline',
});

// Footnotes
globalStyle(`:where(${markdown}) > section.footnotes`, {
	marginTop: calc.multiply(vars.space, 2),
	borderTop: `1px ${vars.color['mono.90']} solid`,
});
globalStyle(`:where(${markdown}) > section.footnotes > h2`, {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: 0,
	margin: '-1px',
	overflow: 'hidden',
	clipPath: 'inset(50%)',
	whiteSpace: 'nowrap',
	borderWidth: 0,
});
globalStyle(`:where(${markdown}) > section.footnotes > ol`, {
	...vars.typography['normal.10'],
	margin: `${calc.multiply(vars.space, 2)} 0 0`,
});
