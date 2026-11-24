import { decodeHTMLStrict } from 'entities/decode';
import type { Logger } from 'tslog';

import type { OpenGraphData } from './definitions';

type ElementLike = {
	getAttribute: (name: string) => string | null;
};

type TextLike = {
	text: string | null;
};

const consume = async (stream: ReadableStream): Promise<void> => {
	const reader = stream.getReader();
	let result = await reader.read();
	while (!result.done) {
		result = await reader.read();
	}
};

export const extractOpenGraph = async (response: Response, logger: Logger<unknown>): Promise<OpenGraphData> => {
	const result: OpenGraphData = {};

	logger.info('extracting open graph data', { url: response.url });

	const handleTitle = {
		text(text: TextLike): void {
			const trimmedText = text.text?.trim() ?? '';
			if (trimmedText !== '' && result.title == null) {
				logger.info('extracted title', { title: trimmedText });
				result.title = decodeHTMLStrict(trimmedText);
			}
		},
	};

	const handleMeta = {
		element(el: ElementLike): void {
			const name = el.getAttribute('name');
			const property = el.getAttribute('property');
			const content = el.getAttribute('content');

			if (content == null) {
				return;
			}

			const propertyKey = (name ?? property)?.toLowerCase();
			if (propertyKey == null) {
				return;
			}

			const metadataMap: Record<string, keyof OpenGraphData> = {
				description: 'description',
				'og:title': 'ogTitle',
				'og:description': 'ogDescription',
				'og:image': 'ogImage',
				'og:image:url': 'ogImage',
				'twitter:card': 'twitterCard',
			};

			const targetProperty = metadataMap[propertyKey];
			if (targetProperty != null) {
				const trimmedContent = content.trim();
				logger.info('found metadata', {
					property: targetProperty,
					content: trimmedContent,
				});
				result[targetProperty] = decodeHTMLStrict(trimmedContent);
			}
		},
	};

	const rewriter = new HTMLRewriter().on('head title', handleTitle).on('head meta', handleMeta);

	const transformed = rewriter.transform(response);
	if (transformed.body == null) {
		logger.error('transformed response has no body', { url: response.url });
		throw new Error(`Failed to extract Open Graph data: transformed response has no body (url: ${response.url})`);
	}
	await consume(transformed.body);

	return result;
};
