import { parseZonedDateTime } from '../../foundation/utils/DateUtils';

import type { Post, PostsByYear } from './definitions';

export const groupPostsByYear = (posts: Post[]): PostsByYear[] => {
	const groups = new Map<number, Post[]>();
	for (const post of posts) {
		const { year } = parseZonedDateTime(post.data.publishedAt);
		const group = groups.get(year);
		if (group == null) {
			groups.set(year, [post]);
		} else {
			group.push(post);
		}
	}

	return [...groups.entries()].toSorted(([a], [b]) => b - a).map(([year, group]) => ({ year, posts: group }));
};
