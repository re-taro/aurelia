import { BlogPage } from './BlogPage';

export class PrivacyPage extends BlogPage {
	async goto(): Promise<void> {
		await this.page.goto('/privacy');
	}
}
