import { useSignal } from '@preact/signals';
import type { FunctionalComponent } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';

import type { OpenGraphData } from '../../../../../og/definitions';

import * as styles from './styles.css';

type Props = {
	href: string;
};

type OpenGraphState = {
	data: OpenGraphData | null;
	isLoading: boolean;
};

const nonEmpty = (value: string | undefined): string | undefined => (value == null || value === '' ? undefined : value);

const buildFaviconURL = (origin: string): string => {
	const faviconURL = new URL('https://t3.gstatic.com/faviconV2');
	faviconURL.searchParams.set('client', 'SOCIAL');
	faviconURL.searchParams.set('type', 'FAVICON');
	faviconURL.searchParams.set('fallback_opts', 'TYPE,SIZE,URL');
	faviconURL.searchParams.set('url', origin);
	faviconURL.searchParams.set('size', '32');

	return faviconURL.toString();
};

export const ReactiveLinkCard: FunctionalComponent<Props> = ({ href }) => {
	const url = useMemo(() => new URL(href), [href]);
	const faviconURL = useMemo(() => buildFaviconURL(url.origin), [url]);

	const openGraph = useSignal<OpenGraphState>({ data: null, isLoading: true });

	useEffect(() => {
		const controller = new AbortController();
		if (!openGraph.peek().isLoading) {
			openGraph.value = { data: null, isLoading: true };
		}

		const load = async (): Promise<void> => {
			try {
				const response = await fetch(`/api/og?url=${encodeURIComponent(href)}`, {
					signal: controller.signal,
				});
				if (!response.ok) {
					throw new Error(`Failed to fetch open graph data: ${response.statusText}`);
				}

				const data: OpenGraphData = await response.json();
				openGraph.value = { data, isLoading: false };
			} catch (error) {
				if (controller.signal.aborted) {
					return;
				}
				console.error('Failed to fetch open graph data', { url: href, error });
				openGraph.value = { data: null, isLoading: false };
			}
		};

		void load();

		return (): void => {
			controller.abort();
		};
	}, [href, openGraph]);

	const { data, isLoading } = openGraph.value;
	const title = nonEmpty(data?.ogTitle) ?? nonEmpty(data?.title) ?? url.hostname;
	const description = nonEmpty(data?.ogDescription) ?? nonEmpty(data?.description);
	const ogImage = data?.ogImage;
	const isLargeImage = data?.twitterCard === 'summary_large_image';

	return (
		<a href={href} target="_blank" rel="noreferrer" class={styles.card}>
			{isLoading ? (
				<div class={styles.body}>
					<span class={styles.placeholderTitle} />
					<span class={styles.placeholderDescription} />
					<span class={styles.placeholderMeta} />
				</div>
			) : (
				<>
					<div class={styles.body}>
						<span class={styles.title}>{title}</span>
						{description != null && <span class={styles.description}>{description}</span>}
						<span class={styles.meta}>
							<img src={faviconURL} alt="" decoding="async" loading="lazy" class={styles.favicon} />
							<span class={styles.hostname}>{url.hostname}</span>
						</span>
					</div>
					{ogImage != null && (
						<img
							src={`/api/og/image?url=${encodeURIComponent(ogImage)}`}
							alt=""
							decoding="async"
							loading="lazy"
							class={isLargeImage ? `${styles.image} ${styles.imageLarge}` : styles.image}
						/>
					)}
				</>
			)}
		</a>
	);
};
