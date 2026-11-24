import type { APIRoute } from 'astro';
import * as cc from 'astro:content';

import { generateOgImage } from '../../../context/og/image';
import { postClient } from '../../../infra/PostClient';

export const getStaticPaths = async (): Promise<{ params: { slug: string } }[]> => {
	const { posts } = await postClient.fetchAll(cc, {
		draft: import.meta.env.DEV,
	});

	return posts.map((post) => ({
		params: { slug: post.id },
	}));
};

export const GET: APIRoute = async ({ params }) => {
	const { slug } = params;
	if (slug == null) {
		return new Response('Not Found', { status: 404 });
	}

	const { post } = await postClient.fetch(cc, { id: slug });
	if (post == null) {
		return new Response('Not Found', { status: 404 });
	}

	const image = await generateOgImage({
		title: post.data.title,
		text: post.data.tags.join(', '),
	});

	return new Response(image, { headers: { 'Content-Type': 'image/png' } });
};
