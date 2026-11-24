import { createGlobalThemeContract } from '@vanilla-extract/css';

import { colorMap } from './color';
import { layout } from './layout';
import { Space } from './space';
import { typographyMap } from './typography';

export const vars = createGlobalThemeContract(
	{
		color: colorMap,
		typography: typographyMap,
		space: Space,
		layout: layout.base,
	},
	(_value, path) => `aurelia-${path.join('-').replaceAll('.', '-')}`,
);
