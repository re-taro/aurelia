import type { Locator } from '@playwright/test';

import { BlogPage } from './BlogPage';

export class NotFoundPage extends BlogPage {
	async goto(path: string): Promise<void> {
		await this.page.goto(path);
	}

	get latestPosts(): Locator {
		return this.main.getByRole('heading', { level: 3 });
	}
}
