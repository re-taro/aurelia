import type { APIRoute } from 'astro';

import { extractOpenGraph } from '../../../context/og/services';
import { logger } from '../../../foundation/logger';

import { CACHE_BROWSER_TTL, CACHE_CDN_TTL } from './_internal/definitions';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
	const { searchParams } = new URL(request.url);
	const targetURL = searchParams.get('url');
	if (targetURL == null) {
		logger.warn('url is not provided');
		return new Response('Bad Request', { status: 400 });
	}

	logger.info('getting open graph data', { url: targetURL });

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

		const openGraphData = await extractOpenGraph(targetResponse, logger);
		logger.info('extracted open graph data', {
			url: targetURL,
			data: openGraphData,
		});
		const response = Response.json(openGraphData, {
			headers: {
				'Cache-Control': `public, s-maxage=${CACHE_CDN_TTL}, max-age=${CACHE_BROWSER_TTL}`,
			},
		});
		if (!import.meta.env.DEV) {
			locals.cfContext.waitUntil(caches.default.put(request, response.clone()));
		}

		return response;
	} catch (error) {
		logger.error('Failed to extract OpenGraph data', { url: targetURL, error });
		return new Response('Internal Server Error', { status: 500 });
	}
};
