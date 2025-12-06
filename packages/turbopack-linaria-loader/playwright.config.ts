/* eslint-disable ts/restrict-template-expressions */

import path from 'node:path';
import { devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';

const { CI: isCI = false, TEST_ENV } = process.env;

const port = 3200;

const nextCommandPrefix = 'pnpm exec next';

export const webServer: { type: string; command: string } =
	TEST_ENV === 'development' ?
		{
			type: 'development',
			command: `${nextCommandPrefix} dev -p ${port}`,
		}
	:	{
			type: 'production',
			command: `${nextCommandPrefix} build && pnpm exec next start -p ${port}`,
		};

const config: PlaywrightTestConfig = {
	forbidOnly: Boolean(isCI),
	retries: isCI ? 2 : 0,
	outputDir: path.join(import.meta.dirname, 'test-results'),
	testDir: path.join(import.meta.dirname, 'test'),
	workers: isCI ? 2 : '50%',
	reporter: isCI ? 'github' : 'list',
	webServer: {
		command: webServer.command,
		port,
		reuseExistingServer: !isCI,
	},
	use: {
		baseURL: `http://localhost:${port}`,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
};

export default config;
