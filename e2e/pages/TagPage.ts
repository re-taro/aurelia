import type { Locator } from '@playwright/test';

import { BlogPage } from './BlogPage';

export class TagPage extends BlogPage {
	async goto(tag: string): Promise<void> {
		await this.page.goto(`/tags/${tag}`);
	}

	get posts(): Locator {
		return this.main.getByRole('heading', { level: 3 });
	}
}
