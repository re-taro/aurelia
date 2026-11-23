import type { Tag } from '../context/tag/definitions';
import { compareZonedDateTime, jst, parseZonedDateTime } from '../foundation/utils/DateUtils';
import { createInfraClient, type InfraClient } from '../foundation/utils/InfraUtils';

type GetTagsRequest = { draft?: boolean };
type GetTagsResponse = {
	tags: Tag[];
	total: number;
};

type TagClient = InfraClient<{
	fetchAll: [GetTagsRequest, GetTagsResponse];
}>;

export const tagClient = createInfraClient<TagClient>({
	fetchAll: async (cc, params) => {
		const { draft = false } = params;

		const now = jst();

		const posts = await cc.getCollection('posts', (post) => {
			if (!draft && compareZonedDateTime(now, parseZonedDateTime(post.data.publishedAt), 'asc') < 0) {
				return false;
			}

			return true;
		});

		const tagMap = new Map<Tag, number>();
		for (const post of posts) {
			for (const tag of post.data.tags) {
				tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
			}
		}

		const tags = [...tagMap.entries()];
		tags.sort(([_aTag, aCount], [_bTag, bCount]) => bCount - aCount);

		return {
			tags: tags.map(([tag]) => tag),
			total: tags.length,
		};
	},
});
