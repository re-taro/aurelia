import fs from 'node:fs/promises';
import path from 'node:path';

import type { BrowserContext } from '@playwright/test';

import { APP_ORIGIN, RESOURCES_DIRECTORY, STUB_ORIGIN } from '../definitions';

const FAVICON_ORIGIN = 'https://t3.gstatic.com';

/**
 * リンクカードの取得先を、外部のサイトからスタブ (server/origin.ts) に差し替えた URL
 *
 * https://example.com/large → http://127.0.0.1:<port>/<run>/example.com/large
 */
export const toStubURL = (url: string): string => {
	const { host, pathname } = new URL(url);

	return `${STUB_ORIGIN}/${process.env['E2E_RUN_ID'] ?? 'local'}/${host}${pathname}`;
};

/**
 * ブラウザからの通信をアプリのオリジンに閉じ込める
 *
 * - /api/og の取得先はスタブに差し替える。/api/og 自体は workerd で動くアプリが応答する
 * - リンクカードのファビコン (Google の faviconV2) は e2e/resources/favicon.png を返す
 * - それ以外の外部オリジンへのリクエストは止め、onUnexpected でテストを失敗させる
 */
export const isolateNetwork = async (context: BrowserContext, onUnexpected: (url: string) => void): Promise<void> => {
	const favicon = await fs.readFile(path.resolve(RESOURCES_DIRECTORY, 'favicon.png'));

	await context.route(
		(url) => url.origin === APP_ORIGIN && url.pathname === '/api/og',
		async (route) => {
			const url = new URL(route.request().url());
			const target = url.searchParams.get('url');

			if (target != null) {
				url.searchParams.set('url', toStubURL(target));
			}

			await route.continue({ url: url.href });
		},
	);

	await context.route(
		(url) => url.origin !== APP_ORIGIN && url.protocol !== 'data:' && url.protocol !== 'blob:',
		async (route) => {
			const url = route.request().url();

			if (url.startsWith(`${FAVICON_ORIGIN}/faviconV2?`)) {
				await route.fulfill({ body: favicon, contentType: 'image/png' });
				return;
			}

			onUnexpected(url);
			await route.abort('blockedbyclient');
		},
	);
};
