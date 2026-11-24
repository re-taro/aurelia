import { HTMLRewriter as WasmHTMLRewriter } from 'html-rewriter-wasm';
import { mockLogger } from 'tslog/testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { extractOpenGraph } from './services';

const createLogger = (): ReturnType<typeof mockLogger<unknown>> => mockLogger<unknown>();

const createHtmlResponse = (html: string): Response => new Response(html, { headers: { 'content-type': 'text/html' } });

type ElementHandler = {
	element?: (el: { getAttribute: (name: string) => string | null }) => void;
	text?: (text: { text: string | null }) => void;
};

/**
 * Node 上で実行される vitest にはネイティブの HTMLRewriter が無いため、
 * html-rewriter-wasm を Workers の HTMLRewriter と同じインターフェースに包んで global に差し込む
 */
class HTMLRewriterShim {
	private readonly rewriter = new WasmHTMLRewriter(() => {
		/* noop */
	});

	on(selector: string, handler: ElementHandler): this {
		this.rewriter.on(selector, handler);
		return this;
	}

	transform(response: Response): Response {
		const { rewriter } = this;

		return new Response(
			new ReadableStream({
				async start(controller): Promise<void> {
					try {
						await rewriter.write(new Uint8Array(await response.arrayBuffer()));
						await rewriter.end();
					} finally {
						rewriter.free();
					}
					controller.close();
				},
			}),
		);
	}
}

describe('services', () => {
	describe('extractOpenGraph', () => {
		afterEach(() => {
			vi.unstubAllGlobals();
		});

		describe('HTML の解析', () => {
			beforeEach(() => {
				vi.stubGlobal('HTMLRewriter', HTMLRewriterShim);
			});

			test('head 内の title を抽出する', async () => {
				const response = createHtmlResponse('<html><head><title>My Blog Post</title></head><body></body></html>');

				const result = await extractOpenGraph(response, createLogger());

				expect(result.title).toBe('My Blog Post');
			});

			test('og:* メタデータを property 属性から抽出する', async () => {
				const response = createHtmlResponse(
					`<html><head>
						<meta property="og:title" content="OG Title" />
						<meta property="og:description" content="OG Description" />
						<meta property="og:image" content="https://example.com/image.png" />
					</head><body></body></html>`,
				);

				const result = await extractOpenGraph(response, createLogger());

				expect(result).toStrictEqual({
					ogTitle: 'OG Title',
					ogDescription: 'OG Description',
					ogImage: 'https://example.com/image.png',
				});
			});

			test('description と twitter:card を name 属性から抽出する', async () => {
				const response = createHtmlResponse(
					`<html><head>
						<meta name="description" content="Page description" />
						<meta name="twitter:card" content="summary_large_image" />
					</head><body></body></html>`,
				);

				const result = await extractOpenGraph(response, createLogger());

				expect(result).toStrictEqual({
					description: 'Page description',
					twitterCard: 'summary_large_image',
				});
			});

			test('og:image:url は ogImage にマップされる', async () => {
				const response = createHtmlResponse(
					'<html><head><meta property="og:image:url" content="https://example.com/image.png" /></head><body></body></html>',
				);

				const result = await extractOpenGraph(response, createLogger());

				expect(result.ogImage).toBe('https://example.com/image.png');
			});

			test('property 名は大文字小文字を区別しない', async () => {
				const response = createHtmlResponse(
					'<html><head><meta property="OG:Title" content="Case Insensitive" /></head><body></body></html>',
				);

				const result = await extractOpenGraph(response, createLogger());

				expect(result.ogTitle).toBe('Case Insensitive');
			});

			test('title が複数ある場合は最初のものを優先する', async () => {
				const response = createHtmlResponse(
					'<html><head><title>First</title><title>Second</title></head><body></body></html>',
				);

				const result = await extractOpenGraph(response, createLogger());

				expect(result.title).toBe('First');
			});

			test('head の外にある title は無視する', async () => {
				const response = createHtmlResponse('<html><head></head><body><title>In Body</title></body></html>');

				const result = await extractOpenGraph(response, createLogger());

				expect(result.title).toBeUndefined();
			});

			test('content 属性が無い meta タグは無視する', async () => {
				const response = createHtmlResponse('<html><head><meta property="og:title" /></head><body></body></html>');

				const result = await extractOpenGraph(response, createLogger());

				expect(result).toStrictEqual({});
			});

			test('対応していない property は無視する', async () => {
				const response = createHtmlResponse(
					'<html><head><meta property="og:locale" content="ja_JP" /><meta name="viewport" content="width=device-width" /></head><body></body></html>',
				);

				const result = await extractOpenGraph(response, createLogger());

				expect(result).toStrictEqual({});
			});

			test('meta の content の HTML エンティティをデコードする', async () => {
				const response = createHtmlResponse(
					'<html><head><meta property="og:title" content="Tom &amp; Jerry" /></head><body></body></html>',
				);

				const result = await extractOpenGraph(response, createLogger());

				expect(result.ogTitle).toBe('Tom & Jerry');
			});

			test('title の HTML エンティティをデコードする', async () => {
				const response = createHtmlResponse(
					'<html><head><title>Tom &amp; Jerry &lt;S1&gt;</title></head><body></body></html>',
				);

				const result = await extractOpenGraph(response, createLogger());

				expect(result.title).toBe('Tom & Jerry <S1>');
			});

			test('title と content の前後の空白を取り除く', async () => {
				const response = createHtmlResponse(
					'<html><head><title>  Spaced Title  </title><meta property="og:title" content="  Spaced OG  " /></head><body></body></html>',
				);

				const result = await extractOpenGraph(response, createLogger());

				expect(result.title).toBe('Spaced Title');
				expect(result.ogTitle).toBe('Spaced OG');
			});
		});

		describe('HTMLRewriter との連携', () => {
			test('登録したハンドラが HTMLRewriter から呼び出される', async () => {
				vi.stubGlobal(
					'HTMLRewriter',
					class {
						private readonly handlers = new Map<string, ElementHandler>();

						on(selector: string, handler: ElementHandler): this {
							this.handlers.set(selector, handler);
							return this;
						}

						transform(_response: Response): Response {
							const attributes = { name: null, property: 'og:title', content: 'Native OG' };
							this.handlers.get('head title')?.text?.({ text: 'Native Title' });
							this.handlers.get('head meta')?.element?.({
								getAttribute: (name) => attributes[name as keyof typeof attributes],
							});
							return new Response('');
						}
					},
				);

				const result = await extractOpenGraph(createHtmlResponse(''), createLogger());

				expect(result).toStrictEqual({ title: 'Native Title', ogTitle: 'Native OG' });
			});

			test('transform 後のレスポンスに body が無い場合はエラーを投げる', async () => {
				vi.stubGlobal(
					'HTMLRewriter',
					class {
						on(): this {
							return this;
						}

						transform(_response: Response): Response {
							return { body: null } as Response;
						}
					},
				);
				const logger = createLogger();

				await expect(extractOpenGraph(createHtmlResponse(''), logger)).rejects.toThrow(
					'Failed to extract Open Graph data: transformed response has no body',
				);
				expect(logger.error.calls).toStrictEqual([['transformed response has no body', { url: '' }]]);
			});
		});
	});
});
