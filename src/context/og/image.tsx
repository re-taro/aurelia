import fs from 'node:fs/promises';
import path from 'node:path';

import satori from 'satori';
import sharp from 'sharp';

import { Card, FONT_MONO, FONT_SANS } from './_internal/Card';
import { toChunks } from './chunks';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, type OgImageInput } from './definitions';

const FONTS_DIR = path.resolve(process.cwd(), 'src/assets/fonts');

type Font = Parameters<typeof satori>[1]['fonts'][number];

let fontsPromise: Promise<Font[]> | null = null;

const loadFonts = (): Promise<Font[]> => {
	fontsPromise ??= (async (): Promise<Font[]> => {
		const [sans, mono] = await Promise.all([
			fs.readFile(path.join(FONTS_DIR, 'NotoSansJP-Bold.otf')),
			fs.readFile(path.join(FONTS_DIR, 'JetBrainsMono-Medium.ttf')),
		]);
		return [
			{ name: FONT_SANS, data: sans, weight: 700, style: 'normal' },
			{ name: FONT_MONO, data: mono, weight: 500, style: 'normal' },
		];
	})();

	return fontsPromise;
};

export const generateOgImage = async (input: OgImageInput): Promise<Uint8Array<ArrayBuffer>> => {
	const fonts = await loadFonts();

	const chunks = {
		title: toChunks(input.title),
		text: input.text == null || input.text === '' ? null : toChunks(input.text),
	};
	const svg = await satori(<Card title={chunks.title} text={chunks.text} />, {
		width: OG_IMAGE_WIDTH,
		height: OG_IMAGE_HEIGHT,
		fonts,
	});

	const png = await sharp(Buffer.from(svg)).png().toBuffer();

	return new Uint8Array(png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength));
};
