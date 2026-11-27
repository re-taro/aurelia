import { expect, type Locator, type Page } from '@playwright/test';

import type { DeviceType } from '../definitions';

/**
 * すべてのページに共通する枠 (CommonLayout)
 */
export class BlogPage {
	readonly page: Page;
	readonly deviceType: DeviceType;

	constructor(page: Page, deviceType: DeviceType) {
		this.page = page;
		this.deviceType = deviceType;
	}

	get header(): Locator {
		return this.page.getByRole('banner');
	}

	get siteLink(): Locator {
		return this.header.getByRole('link', { name: 'blog.re-taro.dev' });
	}

	get rssLink(): Locator {
		return this.header.getByRole('link', { name: 'RSS' });
	}

	get portfolioLink(): Locator {
		return this.header.getByRole('link', { name: 'ポートフォリオ' });
	}

	get main(): Locator {
		return this.page.getByRole('main');
	}

	get heading(): Locator {
		return this.main.getByRole('heading', { level: 1 });
	}

	get footer(): Locator {
		return this.page.getByRole('contentinfo');
	}

	get privacyLink(): Locator {
		return this.footer.getByRole('link', { name: 'Privacy Policy' });
	}

	/**
	 * 背景のクラゲ (WebGL)。ClientRouter の遷移をまたいで同じ要素が使い回される
	 */
	get background(): Locator {
		return this.page.locator('aurelia-background');
	}

	/**
	 * ClientRouter の遷移 (View Transition) が終わるのを待つ。
	 * 終わる前に次の遷移を始めると、前の遷移が打ち切られて例外が出る
	 */
	async waitForTransition(): Promise<void> {
		await expect(this.page.locator('html')).not.toHaveAttribute('data-astro-transition');
	}

	/**
	 * 記事へのリンク。一覧では「MM-DD タイトル」の形で並ぶ
	 */
	postLink(title: string): Locator {
		return this.main.getByRole('link', { name: title });
	}
}
