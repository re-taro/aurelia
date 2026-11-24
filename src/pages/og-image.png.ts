import type { APIRoute } from 'astro';

import { generateOgImage } from '../context/og/image';
import { SITE_DESCRIPTION, SITE_NAME } from '../foundation/definitions';

export const GET: APIRoute = async () => {
	const image = await generateOgImage({ title: SITE_NAME, text: SITE_DESCRIPTION });

	return new Response(image, { headers: { 'Content-Type': 'image/png' } });
};
