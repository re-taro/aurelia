import cloudflare from '@astrojs/cloudflare';
import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import expressiveCode from 'astro-expressive-code';
import { defineConfig, envField } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkCjkFriendly from 'remark-cjk-friendly';
import remarkGfmStrikethroughCjkFriendly from 'remark-cjk-friendly-gfm-strikethrough';
import remarkJoinCjkLines from 'remark-join-cjk-lines';
import remarkMath from 'remark-math';
import glsl from 'vite-plugin-glsl';

import { rehypeAureliaHeading } from './src/context/post/plugins/rehype-aurelia-heading';
import { remarkAureliaGitHubPermalink } from './src/context/post/plugins/remark-aurelia-github-permalink';

export default defineConfig({
	site: 'https://blog.re-taro.dev',
	// v3 以前は /sitemap.xml を配信していた。@astrojs/sitemap は sitemap-index.xml 固定なので旧 URL を転送する
	redirects: {
		'/sitemap.xml': '/sitemap-index.xml',
	},
	integrations: [
		expressiveCode({
			themes: ['vitesse-black'],
			frames: {
				showCopyToClipboardButton: false,
			},
			styleOverrides: {
				borderRadius: '0',
				frames: {
					frameBoxShadowCssValue: 'none',
				},
				codeFontFamily:
					'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace',
			},
		}),
		mdx(),
		sitemap(),
		partytown({
			config: {
				forward: ['dataLayer.push'],
			},
		}),
		preact(),
	],
	env: {
		schema: {
			GOOGLE_ANALYTICS_ID: envField.string({
				context: 'client',
				access: 'public',
				optional: true,
			}),
		},
	},
	vite: {
		plugins: [
			vanillaExtractPlugin(),
			// シェーダは JS に文字列として埋め込まれるので、本番ではコメントと空白を落とす。
			// astro build は設定を読む前に NODE_ENV=production を入れる。開発中は原文のまま
			glsl({ minify: process.env.NODE_ENV === 'production' }),
		],
	},
	adapter: cloudflare({
		imageService: 'compile',
		prerenderEnvironment: 'node',
	}),
	markdown: {
		processor: unified({
			remarkPlugins: [
				remarkMath,
				remarkJoinCjkLines,
				remarkCjkFriendly,
				remarkGfmStrikethroughCjkFriendly,
				remarkAureliaGitHubPermalink,
			],
			rehypePlugins: [rehypeHeadingIds, rehypeAureliaHeading, [rehypeKatex, { strict: false, output: 'mathml' }]],
		}),
	},
});
