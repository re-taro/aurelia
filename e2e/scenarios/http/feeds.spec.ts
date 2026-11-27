import { expect, test } from '@playwright/test';

import { FUTURE_POST, POSTS } from '../../definitions';

const SITE = 'https://blog.re-taro.dev';

test.describe('RSS', () => {
	test('公開済みの記事を新しい順に並べる', async ({ request }) => {
		const response = await request.get('/rss.xml');

		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('xml');

		const body = await response.text();

		expect(body).not.toContain(FUTURE_POST.id);
		expect(body).toMatchSnapshot('rss.xml');
	});
});

test.describe('サイトマップ', () => {
	test('公開済みのページを載せる', async ({ request }) => {
		const response = await request.get('/sitemap-0.xml');

		expect(response.status()).toBe(200);

		const body = await response.text();

		for (const { id } of Object.values(POSTS)) {
			expect(body).toContain(`<loc>${SITE}/p/${id}/</loc>`);
		}
		expect(body).not.toContain(FUTURE_POST.id);
		expect(body).toMatchSnapshot('sitemap-0.xml');
	});

	test('索引から各サイトマップをたどれる', async ({ request }) => {
		const response = await request.get('/sitemap-index.xml');

		expect(response.status()).toBe(200);
		expect(await response.text()).toContain(`<loc>${SITE}/sitemap-0.xml</loc>`);
	});

	test('以前の /sitemap.xml から転送する', async ({ request }) => {
		const response = await request.get('/sitemap.xml', { maxRedirects: 0 });

		expect(response.status()).toBe(301);
		expect(response.headers()['location']).toBe('/sitemap-index.xml');
	});

	test('robots.txt でサイトマップを案内する', async ({ request }) => {
		const response = await request.get('/robots.txt');

		expect(response.status()).toBe(200);
		expect(await response.text()).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
	});
});

test.describe('OG 画像', () => {
	test('サイトの OG 画像', async ({ request }) => {
		const response = await request.get('/og-image.png');

		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toBe('image/png');
		expect(await response.body()).toMatchSnapshot('og-image.png');
	});

	for (const [key, { id }] of Object.entries(POSTS)) {
		test(`記事の OG 画像 (${key})`, async ({ request }) => {
			const response = await request.get(`/p/${id}/og-image.png`);

			expect(response.status()).toBe(200);
			expect(await response.body()).toMatchSnapshot(`${key}.png`);
		});
	}
});
