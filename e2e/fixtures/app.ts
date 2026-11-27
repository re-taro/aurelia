import path from 'node:path';

import { expect, test as base, type Locator } from '@playwright/test';

import { RESOURCES_DIRECTORY, type DeviceType } from '../definitions';
import { collectPageErrors, findUnexpectedErrors, type ErrorPattern } from '../utils/errors';
import { expectNoHorizontalOverflow } from '../utils/layout';
import { isolateNetwork } from '../utils/network';
import { settle, trackNetwork } from '../utils/settle';

const SCREENSHOT_STYLE = path.resolve(RESOURCES_DIRECTORY, 'screenshot.css');

type CaptureOptions = {
	target?: Locator;
	fullPage?: boolean;
	mask?: Locator[];
};

type AppOptions = {
	deviceType: DeviceType;
	allowedErrors: ErrorPattern[];
};

type AppFixtures = {
	capture: (name: string, options?: CaptureOptions) => Promise<void>;
};

export const test = base.extend<AppOptions & AppFixtures>({
	deviceType: ['pc', { option: true }],
	allowedErrors: [[], { option: true }],
	page: async ({ allowedErrors, context, page }, use) => {
		const errors: string[] = [];

		collectPageErrors(page, errors);
		await isolateNetwork(context, (url) => {
			errors.push(`外部のオリジンへのリクエストを止めました: ${url}`);
		});
		trackNetwork(page);

		await use(page);

		const unexpected = findUnexpectedErrors(errors, allowedErrors);

		if (unexpected.length > 0) {
			throw new Error(`ページでエラーが発生しました。\n${unexpected.join('\n')}`);
		}
	},
	capture: async ({ page }, use) => {
		await use(async (name, { fullPage = true, mask = [], target } = {}) => {
			await settle(page);
			await expectNoHorizontalOverflow(page);

			await (target == null
				? expect(page).toHaveScreenshot(`${name}.png`, { fullPage, mask, stylePath: SCREENSHOT_STYLE })
				: expect(target).toHaveScreenshot(`${name}.png`, { mask, stylePath: SCREENSHOT_STYLE }));
		});
	},
});
