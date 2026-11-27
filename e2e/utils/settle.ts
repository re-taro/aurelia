import { expect, type Page, type Request } from '@playwright/test';

const trackers = new WeakMap<Page, NetworkTracker>();

/**
 * ページが出したリクエストのうち、終わっていないものを数える
 */
class NetworkTracker {
	readonly #inflight = new Set<Request>();
	#waiters: (() => void)[] = [];

	constructor(page: Page) {
		page.on('request', (request) => {
			this.#inflight.add(request);
		});
		page.on('requestfinished', (request) => {
			this.#settle(request);
		});
		page.on('requestfailed', (request) => {
			this.#settle(request);
		});
	}

	get idle(): boolean {
		return this.#inflight.size === 0;
	}

	async waitForIdle(): Promise<void> {
		if (this.idle) {
			return;
		}

		await new Promise<void>((resolve) => {
			this.#waiters.push(resolve);
		});
	}

	#settle(request: Request): void {
		this.#inflight.delete(request);

		if (!this.idle) {
			return;
		}

		const waiters = this.#waiters;

		this.#waiters = [];

		for (const resolve of waiters) {
			resolve();
		}
	}
}

/**
 * ブラウザの中で動かす。遅延読み込みの画像を読ませ、フォントと画像のデコードを待ってから 2 フレーム待つ
 */
const waitForRendering = async (): Promise<void> => {
	const images = [...document.images];

	for (const image of images) {
		image.loading = 'eager';
	}

	await document.fonts.ready;
	await Promise.all(images.map(async (image) => image.decode().catch(() => null)));
	await new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				resolve();
			});
		});
	});
};

/**
 * ブラウザの中で動かす。client:visible の島は画面に入るまで hydrate しないので、すべて一度画面に入れる。
 * IntersectionObserver は描画のたびにしか判定しないので、1 つずつフレームを待つ
 */
const revealIslands = async (): Promise<void> => {
	const { scrollX, scrollY } = globalThis;
	// oxlint-disable-next-line unicorn/consistent-function-scoping
	const nextFrame = async (): Promise<void> =>
		new Promise((resolve) => {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					resolve();
				});
			});
		});

	for (const island of document.querySelectorAll('astro-island[ssr]')) {
		// astro-island は display: contents で箱を持たないので、中身を画面に入れる
		(island.firstElementChild ?? island).scrollIntoView({ behavior: 'instant', block: 'center' });
		await nextFrame();
	}

	globalThis.scrollTo({ behavior: 'instant', left: scrollX, top: scrollY });
};

export const trackNetwork = (page: Page): void => {
	trackers.set(page, new NetworkTracker(page));
};

/**
 * 撮影できる状態になるまで待つ。島の hydrate・通信・フォント・画像の読み込みが終わり、それ以上動かなくなった状態
 */
export const settle = async (page: Page): Promise<void> => {
	const tracker = trackers.get(page);

	if (tracker == null) {
		throw new Error('settle の前に trackNetwork を呼んでください。');
	}

	await page.evaluate(revealIslands);
	// hydrate を終えた島からは ssr 属性が外れる
	await expect(page.locator('astro-island[ssr]')).toHaveCount(0);

	do {
		await tracker.waitForIdle();
		await page.evaluate(waitForRendering);
	} while (!tracker.idle);
};
