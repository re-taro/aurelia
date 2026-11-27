import { expect, test } from '@playwright/test';
import sharp from 'sharp';

import { toStubURL } from '../../utils/network';

/**
 * リンクカードのための OGP の取得 (/api/og) と画像の縮小 (/api/og/image)。
 * workerd の上で、HTMLRewriter と Images binding を本番と同じように通す。取得先はスタブ (server/origin.ts)
 */
test.describe('/api/og', () => {
	test('ページの OGP を返す', async ({ request }) => {
		const response = await request.get('/api/og', { params: { url: toStubURL('https://example.com/large') } });

		expect(response.status()).toBe(200);
		expect(response.headers()['cache-control']).toBe('public, s-maxage=604800, max-age=3600');
		expect(await response.json()).toStrictEqual({
			title: '大きな画像のページ',
			description: 'og:title より優先度の低い説明',
			ogTitle: '大きな画像のカード',
			ogDescription: 'twitter:card が summary_large_image のページ。画像はカードの幅いっぱいに出る。',
			ogImage: toStubURL('https://example.com/large.png'),
			twitterCard: 'summary_large_image',
		});
	});

	test('title の文字参照を戻す', async ({ request }) => {
		const response = await request.get('/api/og', { params: { url: toStubURL('https://example.com/plain') } });

		expect(await response.json()).toStrictEqual({ title: '画像のないカード & エスケープされたタイトル' });
	});

	test('取得先が 404 なら 404 を返す', async ({ request }) => {
		const response = await request.get('/api/og', { params: { url: toStubURL('https://example.com/missing') } });

		expect(response.status()).toBe(404);
	});

	test('url がなければ 400 を返す', async ({ request }) => {
		const response = await request.get('/api/og');

		expect(response.status()).toBe(400);
	});
});

test.describe('/api/og/image', () => {
	test('画像を高さ 128px の WebP に縮小して返す', async ({ request }) => {
		const response = await request.get('/api/og/image', {
			params: { url: toStubURL('https://example.com/large.png') },
		});

		expect(response.status()).toBe(200);

		const { format, height, width } = await sharp(await response.body()).metadata();

		expect({ format, height, width }).toStrictEqual({ format: 'webp', height: 128, width: 244 });
	});

	test('url がなければ 400 を返す', async ({ request }) => {
		const response = await request.get('/api/og/image');

		expect(response.status()).toBe(400);
	});
});
