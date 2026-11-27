import type * as AstroContent from 'astro:content';

import type { Post } from '../context/post/definitions';

type ContentCollectionClient = typeof AstroContent;

export const createContentCollection = (posts: Post[]): ContentCollectionClient =>
	({
		getCollection: (_collection: 'posts', filter?: (entry: Post) => boolean): Promise<Post[]> =>
			Promise.resolve(filter == null ? posts : posts.filter((post) => filter(post))),
		getEntry: (_collection: 'posts', id: string): Promise<Post | undefined> =>
			Promise.resolve(posts.find((post) => post.id === id)),
	}) as unknown as ContentCollectionClient;
