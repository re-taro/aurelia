import path from 'node:path';

export const DEVICE_TYPES = ['pc', 'sp'] as const;

export type DeviceType = (typeof DEVICE_TYPES)[number];

export const ROOT_DIRECTORY = path.resolve(import.meta.dirname, '..');
export const E2E_DIRECTORY = import.meta.dirname;

/**
 * e2e 用のビルドの出力先。通常の dist/ を上書きしないよう分ける。
 * Docker では e2e/ を手元のディレクトリで覆うので、e2e/ の外に置く
 */
export const DIST_DIRECTORY = path.resolve(ROOT_DIRECTORY, 'dist-e2e');
/**
 * 固定の記事。src/content.config.ts は AURELIA_CONTENTS_DIR があればこちらを読む
 */
export const CONTENTS_DIRECTORY = path.resolve(E2E_DIRECTORY, 'contents');
export const RESOURCES_DIRECTORY = path.resolve(E2E_DIRECTORY, 'resources');

const port = (name: string, fallback: number): number => {
	const value = process.env[name];

	return value == null ? fallback : Number(value);
};

export const APP_PORT = port('E2E_APP_PORT', 4400);
export const APP_ORIGIN = `http://localhost:${String(APP_PORT)}`;

export const STUB_ORIGIN_PORT = port('E2E_STUB_ORIGIN_PORT', 4401);
export const STUB_ORIGIN = `http://127.0.0.1:${String(STUB_ORIGIN_PORT)}`;

export const E2E_TIME_ZONE = 'Asia/Tokyo';
export const E2E_LOCALE = 'ja-JP';
export const E2E_LAUNCH_OPTIONS = {
	args: [`--lang=${E2E_LOCALE}`],
	env: { ...process.env, LC_ALL: 'ja_JP.UTF-8' },
};

/**
 * 固定の記事の ID。e2e/contents/<ID>/slug.mdx
 */
export const POSTS = {
	markdown: {
		id: '01E2E00000000000000000MD01',
		title: 'Markdown の表示確認',
		tags: ['Markdown', 'Test Fixture'],
	},
	code: {
		id: '01E2E00000000000000000CD01',
		title: 'コードの表示確認',
		tags: ['Code', 'Test Fixture'],
	},
	media: {
		id: '01E2E00000000000000000MA01',
		title: '画像とリンクカードの表示確認',
		tags: ['Media', 'Test Fixture'],
	},
	note: {
		id: '01E2E00000000000000000NT01',
		title: '見出しのない短い記事',
		tags: ['Note', 'Test Fixture'],
	},
} as const;

/**
 * 公開日が未来なので、ビルドに含まれない記事
 */
export const FUTURE_POST = {
	id: '01E2E00000000000000000FT01',
	title: '公開日が未来の記事',
	tag: 'Future',
} as const;

export type PostKey = keyof typeof POSTS;
