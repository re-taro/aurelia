import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import * as cc from 'astro:content';

import { SITE_DESCRIPTION, SITE_NAME } from '../foundation/definitions';
import { parseZonedDateTime } from '../foundation/utils/DateUtils';
import { postClient } from '../infra/PostClient';

export const GET: APIRoute = async ({ site }) => {
	if (site == null) {
		return new Response('Not Found', { status: 404 });
	}

	const { posts } = await postClient.fetchAll(cc, { draft: import.meta.env.DEV });

	return rss({
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		site,
		items: posts.map((post) => ({
			title: post.data.title,
			link: new URL(`/p/${post.id}`, site.origin).href,
			pubDate: new Date(parseZonedDateTime(post.data.publishedAt).epochMilliseconds),
		})),
	});
};
