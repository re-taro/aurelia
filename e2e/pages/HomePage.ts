import type { Locator } from '@playwright/test';

import { BlogPage } from './BlogPage';

export class HomePage extends BlogPage {
	async goto(): Promise<void> {
		await this.page.goto('/');
	}

	postsOf(year: number): Locator {
		const heading = this.page.getByRole('heading', { level: 2, name: String(year) });

		return this.main.locator('section section').filter({ has: heading }).getByRole('heading', { level: 3 });
	}
}
