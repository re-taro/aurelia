import type { Locator } from '@playwright/test';

import { BlogPage } from './BlogPage';

export class TagsPage extends BlogPage {
	async goto(): Promise<void> {
		await this.page.goto('/tags');
	}

	get tagLinks(): Locator {
		return this.main.getByRole('listitem').getByRole('link');
	}

	tagLink(tag: string): Locator {
		return this.tagLinks.filter({ hasText: new RegExp(`^${RegExp.escape(tag)}$`, 'u') });
	}
}
