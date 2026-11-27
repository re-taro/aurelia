import type { Locator } from '@playwright/test';

import { BlogPage } from './BlogPage';

/**
 * 記事 (/p/<id>)
 */
export class PostPage extends BlogPage {
	async goto(id: string): Promise<void> {
		await this.page.goto(`/p/${id}`);
	}

	get article(): Locator {
		return this.main.getByRole('article');
	}

	/**
	 * 名前は CSS で「[ タグ ]」と囲んで読み上げられるので、中の文字で探す
	 */
	tagLink(tag: string): Locator {
		return this.article
			.getByRole('listitem')
			.getByRole('link')
			.filter({ hasText: new RegExp(`^${RegExp.escape(tag)}$`, 'u') });
	}

	get publishedAt(): Locator {
		return this.article.locator('dt:has-text("published at") + dd');
	}

	get updatedAt(): Locator {
		return this.article.locator('dt:has-text("updated at") + dd');
	}

	/**
	 * 目次の開閉ボタン。見出しのない記事では出ない。名前は CSS で「[ open ]」と囲まれる
	 */
	get tocButton(): Locator {
		return this.article.getByRole('button', { name: /\b(?:open|close)\b/u });
	}

	get toc(): Locator {
		return this.page.getByRole('navigation', { name: '目次' });
	}

	tocLink(text: string): Locator {
		return this.toc.getByRole('link', { name: text });
	}

	sectionHeading(text: string): Locator {
		return this.article.getByRole('heading', { name: text });
	}

	get codeBlocks(): Locator {
		return this.article.locator('.expressive-code');
	}

	/**
	 * GitHub のパーマリンクを展開したコード
	 */
	get permalinks(): Locator {
		return this.article
			.locator('figure')
			.filter({ has: this.page.locator('figcaption a[href^="https://github.com/"]') });
	}

	get images(): Locator {
		return this.article.getByRole('img');
	}

	/**
	 * リンクカード。読み込み中は中身が空の枠を出す
	 */
	get linkCards(): Locator {
		return this.article.locator('astro-island > a');
	}

	linkCard(href: string): Locator {
		return this.article.locator(`astro-island > a[href="${href}"]`);
	}

	get footnotes(): Locator {
		return this.article.locator('section[data-footnotes]');
	}

	get math(): Locator {
		return this.article.locator('math');
	}
}
