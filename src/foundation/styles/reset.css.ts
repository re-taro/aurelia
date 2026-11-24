/***
    The new CSS reset - version 1.11.3 (last updated 25.08.2024)
    GitHub page: https://github.com/elad2412/the-new-css-reset
***/

import { globalStyle, type GlobalStyleRule } from '@vanilla-extract/css';

// Remove all the styles of the "User-Agent-Stylesheet", except for the 'display' property
// - The "symbol *" part is to solve Firefox SVG sprite bug
// - The "html" element is excluded, otherwise a bug in Chrome breaks the CSS hyphens property (https://github.com/elad2412/the-new-css-reset/issues/36)
globalStyle('*:where(:not(html, iframe, canvas, img, svg, video, audio):not(svg *, symbol *))', {
	all: 'unset',
	display: 'revert',
});

// Preferred box-sizing value
globalStyle('*, *::before, *::after', {
	boxSizing: 'border-box',
});

// Fix mobile Safari increase font-size on landscape mode
globalStyle('html', {
	MozTextSizeAdjust: 'none',
	WebkitTextSizeAdjust: 'none',
	textSizeAdjust: 'none',
});

// Reapply the pointer cursor for anchor tags
globalStyle('a, button', {
	cursor: 'revert',
});

// Remove list styles (bullets/numbers)
globalStyle('ol, ul, menu, summary', {
	listStyle: 'none',
});

// Firefox: solve issue where nested ordered lists continue numbering from parent (https://bugzilla.mozilla.org/show_bug.cgi?id=1881517)
globalStyle('ol', {
	counterReset: 'revert',
});

// For images to not be able to exceed their container
globalStyle('img', {
	maxInlineSize: '100%',
	maxBlockSize: '100%',
});

// removes spacing between cells in tables
globalStyle('table', {
	borderCollapse: 'collapse',
});

// Safari - solving issue when using user-select:none on the <body> text input doesn't working
globalStyle('input, textarea', {
	WebkitUserSelect: 'auto',
});

// revert the 'white-space' property for textarea elements on Safari
globalStyle('textarea', {
	whiteSpace: 'revert',
});

// minimum style to allow to style meter element
globalStyle('meter', {
	WebkitAppearance: 'revert',
	appearance: 'revert',
});

// preformatted text - use only for this feature
globalStyle(':where(pre)', {
	all: 'revert',
	boxSizing: 'border-box',
});

// reset default text opacity of input placeholder
globalStyle('::placeholder', {
	color: 'unset',
});

// fix the feature of 'hidden' attribute.
// display:revert; revert to element instead of attribute
globalStyle(':where([hidden])', {
	display: 'none',
});

// revert for bug in Chromium browsers
// - fix for the content editable attribute will work properly.
// - webkit-user-select: auto; added for Safari in case of using user-select:none on wrapper element
globalStyle(':where([contenteditable]:not([contenteditable="false"]))', {
	MozUserModify: 'read-write',
	WebkitUserModify: 'read-write',
	overflowWrap: 'break-word',
	WebkitLineBreak: 'after-white-space',
	WebkitUserSelect: 'auto',
} satisfies Record<string, unknown> as GlobalStyleRule);

// apply back the draggable feature - exist only in Chromium and Safari
globalStyle(':where([draggable="true"])', {
	WebkitUserDrag: 'element',
} satisfies Record<string, unknown> as GlobalStyleRule);

// Revert Modal native behavior
globalStyle(':where(dialog:modal)', {
	all: 'revert',
	boxSizing: 'border-box',
});

// Remove details summary webkit styles
globalStyle('::-webkit-details-marker', {
	display: 'none',
});
