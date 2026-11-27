import type { Page } from '@playwright/test';

import type { DeviceType } from '../definitions';
import { BlogPage } from '../pages/BlogPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PostPage } from '../pages/PostPage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { TagPage } from '../pages/TagPage';
import { TagsPage } from '../pages/TagsPage';

import { test as base } from './app';

type PageFixtures = {
	layout: BlogPage;
	homePage: HomePage;
	postPage: PostPage;
	tagsPage: TagsPage;
	tagPage: TagPage;
	privacyPage: PrivacyPage;
	notFoundPage: NotFoundPage;
};

type Use<Value> = (value: Value) => Promise<void>;

const pageObject =
	<Value>(PageObject: new (page: Page, deviceType: DeviceType) => Value) =>
	async ({ deviceType, page }: { deviceType: DeviceType; page: Page }, use: Use<Value>): Promise<void> => {
		await use(new PageObject(page, deviceType));
	};

export const test = base.extend<PageFixtures>({
	layout: pageObject(BlogPage),
	homePage: pageObject(HomePage),
	postPage: pageObject(PostPage),
	tagsPage: pageObject(TagsPage),
	tagPage: pageObject(TagPage),
	privacyPage: pageObject(PrivacyPage),
	notFoundPage: pageObject(NotFoundPage),
});
