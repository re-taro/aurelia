import { globalStyle } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from './tokens';
import { MediaQuery } from './tokens/breakpoint';

globalStyle('html', {
	...vars.typography['normal.8'],
	background: vars.color['mono.50'],
	color: vars.color['mono.a'],
	WebkitFontSmoothing: 'antialiased',
	MozOsxFontSmoothing: 'grayscale',
	textAutospace: 'normal',
	interpolateSize: 'allow-keywords',
	fontFamily: "Inter, Roboto, 'Helvetica Neue', 'Arial Nova', 'Nimbus Sans', Arial, sans-serif",
	scrollBehavior: 'smooth',
	// iOS のバウンスで固定配置の背景 canvas ごとページが動き、下の無地が覗いて背景が伸びたように見えるのを防ぐ
	overscrollBehaviorY: 'none',
	scrollPaddingTop: calc.multiply(vars.space, 2),
	'@media': {
		[MediaQuery.REDUCED_MOTION]: {
			scrollBehavior: 'auto',
		},
	},
});

// ClientRouter のページ遷移中はスクロール位置の復元や遷移先ハッシュへの移動が走るため、
// MPA のページロードと同様に即時スクロールさせる
globalStyle('html[data-astro-transition]', {
	scrollBehavior: 'auto',
});

// アイコン下にベースライン由来の余白ができるのを防ぐ
globalStyle('svg', {
	display: 'block',
});

globalStyle(':focus-visible', {
	boxShadow: `0 0 0 3px ${vars.color['brand.alpha']}`,
});
