import { assignVars, createGlobalTheme, globalStyle } from '@vanilla-extract/css';

import { vars } from './tokens';
import { Color } from './tokens/color';
import { layout } from './tokens/layout';
import { mapResponsiveOverrides } from './tokens/responsive';
import { Space } from './tokens/space';
import { Typography } from './tokens/typography';

createGlobalTheme(':root', vars, {
	color: {
		'mono.a': Color.MONO_A,
		'mono.a.hover': Color.MONO_A_HOVER,
		'mono.50': Color.MONO_50,
		'mono.50.hover': Color.MONO_50_HOVER,
		'mono.90': Color.MONO_90,
		brand: Color.BRAND,
		'brand.alpha': Color.BRAND_ALPHA,
		'brand.hover': Color.BRAND_HOVER,
	},
	typography: {
		'comfort.7': Typography.COMFORT_7,
		'comfort.8': Typography.COMFORT_8,
		'normal.5': Typography.NORMAL_5,
		'normal.7': Typography.NORMAL_7,
		'normal.8': Typography.NORMAL_8,
		'normal.10': Typography.NORMAL_10,
		'dense.4': Typography.DENSE_4,
		'dense.5': Typography.DENSE_5,
		'dense.7': Typography.DENSE_7,
		'dense.8': Typography.DENSE_8,
		'dense.10': Typography.DENSE_10,
	},
	space: Space,
	layout: layout.base,
});

globalStyle(':root', {
	'@media': mapResponsiveOverrides(layout, (values) => ({
		vars: assignVars(vars.layout, values),
	})),
});
