import { createVar, globalStyle } from '@vanilla-extract/css';

export const DRAWER_ATTRIBUTE = 'data-aurelia-drawer';

export const drawerWidth = createVar();

export const drawerOpenSelector = `body:has([${DRAWER_ATTRIBUTE}]:popover-open)`;

globalStyle(':root', {
	vars: {
		[drawerWidth]: 'min(20rem, 80vw)',
	},
});
