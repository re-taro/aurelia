import type { CollectionEntry } from 'astro:content';

import { normalizeTag } from '../context/tag/services';
import { compareZonedDateTime, jst, parseZonedDateTime } from '../foundation/utils/DateUtils';
import { createInfraClient, type InfraClient } from '../foundation/utils/InfraUtils';

type Post = CollectionEntry<'posts'>;

type GetPostRequest = { id: string };
type GetPostResponse = { post: Post | null };

type GetPostsRequest = { tag?: string; draft?: boolean };
type GetPostsResponse = {
	posts: Post[];
	total: number;
};

type PostClient = InfraClient<{
	fetch: [GetPostRequest, GetPostResponse];
	fetchAll: [GetPostsRequest, GetPostsResponse];
}>;

export const postClient = createInfraClient<PostClient>({
	fetch: async (cc, params) => {
		const post = await cc.getEntry('posts', params.id);

		return { post: post ?? null };
	},
	fetchAll: async (cc, params) => {
		const { tag, draft = false } = params;

		const now = jst();

		const posts = await cc.getCollection('posts', (post) => {
			if (!draft && compareZonedDateTime(now, parseZonedDateTime(post.data.publishedAt), 'asc') < 0) {
				return false;
			}
			if (tag != null) {
				return post.data.tags.some((t) => normalizeTag(t) === tag);
			}

			return true;
		});

		const sortedPosts = posts.toSorted((a, b) => {
			const aDate = parseZonedDateTime(a.data.publishedAt);
			const bDate = parseZonedDateTime(b.data.publishedAt);

			return compareZonedDateTime(aDate, bDate, 'desc');
		});

		return { posts: sortedPosts, total: sortedPosts.length };
	},
});
