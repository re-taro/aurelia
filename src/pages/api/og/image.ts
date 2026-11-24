import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

import { logger } from '../../../foundation/logger';

import { CACHE_BROWSER_TTL, CACHE_CDN_TTL } from './_internal/definitions';

export const prerender = false;

const optimizeImage = async (response: Response): Promise<Response> => {
	if (import.meta.env.DEV) {
		return response;
	}

	if (!response.body) {
		return new Response('Bad Request', { status: 400 });
	}

	const transformed = await env.IMAGES.input(response.body)
		.transform({
			height: 128,
		})
		.output({
			format: 'image/webp',
		});

	return transformed.response();
};

export const GET: APIRoute = async ({ request, locals }) => {
	const { searchParams } = new URL(request.url);
	const targetURL = searchParams.get('url');
	if (targetURL == null) {
		logger.warn('url is not provided');
		return new Response('Bad Request', { status: 400 });
	}

	logger.info('getting open graph image', { url: targetURL });

	if (!import.meta.env.DEV) {
		const cachedResponse = await caches.default.match(request);
		if (cachedResponse != null) {
			logger.info('cache hit', { url: targetURL });
			return cachedResponse;
		}
	}

	logger.info('cache miss', { url: targetURL });
	try {
		const targetRequest = new Request(targetURL);
		const targetResponse = await fetch(targetRequest);
		if (!targetResponse.ok) {
			logger.warn('request failed', {
				url: targetURL,
				status: targetResponse.status,
			});
			return new Response('Not Found', { status: 404 });
		}

		const optimizedResponse = await optimizeImage(targetResponse);
		logger.info('optimized image', { url: targetURL });
		const response = new Response(optimizedResponse.body, {
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_CDN_TTL}, max-age=${CACHE_BROWSER_TTL}`,
			},
		});
		if (!import.meta.env.DEV) {
			locals.cfContext.waitUntil(caches.default.put(request, response.clone()));
		}
		return response;
	} catch (error) {
		logger.error('Failed to optimize image', { url: targetURL, error });
		return new Response('Internal Server Error', { status: 500 });
	}
};
