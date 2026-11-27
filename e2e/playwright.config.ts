import { existsSync } from 'node:fs';
import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

import {
	APP_ORIGIN,
	APP_PORT,
	DIST_DIRECTORY,
	E2E_DIRECTORY,
	E2E_LAUNCH_OPTIONS,
	E2E_LOCALE,
	E2E_TIME_ZONE,
	ROOT_DIRECTORY,
	STUB_ORIGIN,
	type DeviceType,
} from './definitions';

const isCI = process.env['CI'] != null;
// コミットするベースラインは Docker の中で撮ったもの (docker) だけ。手元のブラウザで撮ったものは local に分ける
const baseline = process.env['E2E_BASELINE'] ?? 'local';

// webServer は globalSetup より先に起動するので、ビルドの有無はここで確かめる
if (!existsSync(path.resolve(DIST_DIRECTORY, 'server/entry.mjs'))) {
	throw new Error('e2e 用のビルドがありません。先に `pnpm run e2e:build` を実行してください。');
}

// 実行ごとの ID。worker はこのプロセスの環境変数を引き継ぐので、全 worker で同じ値になる
process.env['E2E_RUN_ID'] ??= Date.now().toString(36);

export default defineConfig<{ deviceType: DeviceType }>({
	expect: {
		toHaveScreenshot: {
			animations: 'disabled',
			caret: 'hide',
			scale: 'css',
		},
	},
	forbidOnly: isCI,
	fullyParallel: true,
	outputDir: './test-results',
	projects: [
		{
			name: 'HTTP',
			testDir: './scenarios/http',
			use: { baseURL: APP_ORIGIN },
		},
		{
			name: 'Chrome-PC',
			testIgnore: '**/http/**',
			use: { ...devices['Desktop Chrome'], deviceType: 'pc' },
		},
		{
			name: 'Chrome-SP',
			testIgnore: '**/http/**',
			use: { ...devices['Pixel 7'], deviceType: 'sp' },
		},
	],
	reporter: isCI
		? [['github'], ['list'], ['html', { open: 'never', outputFolder: './playwright-report' }]]
		: [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }]],
	retries: isCI ? 2 : 0,
	snapshotPathTemplate: `${E2E_DIRECTORY}/__screenshots__/${baseline}/{projectName}/{testFilePath}-snapshots/{arg}{ext}`,
	testDir: './scenarios',
	timeout: 30_000,
	use: {
		baseURL: APP_ORIGIN,
		launchOptions: E2E_LAUNCH_OPTIONS,
		locale: E2E_LOCALE,
		timezoneId: E2E_TIME_ZONE,
		trace: isCI ? 'on-first-retry' : 'retain-on-failure',
	},
	webServer: [
		{
			// 本番と同じく workerd の上で動かす。/api/og などのサーバー側の処理もここを通る
			command: `node_modules/.bin/astro preview --outDir ${DIST_DIRECTORY} --port ${String(APP_PORT)}`,
			cwd: ROOT_DIRECTORY,
			reuseExistingServer: !isCI,
			stdout: 'ignore',
			stderr: 'pipe',
			timeout: 60_000,
			url: `${APP_ORIGIN}/`,
		},
		{
			command: 'node e2e/server/origin.ts',
			cwd: ROOT_DIRECTORY,
			reuseExistingServer: !isCI,
			url: `${STUB_ORIGIN}/`,
		},
	],
});
