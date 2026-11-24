import { loadDefaultJapaneseParser } from 'budoux';

const parser = loadDefaultJapaneseParser();

const normalizeChunks = (chunks: string[]): string[] => {
	const result: string[] = [];
	for (const chunk of chunks) {
		const leading = /^\s*/u.exec(chunk)?.[0] ?? '';
		const body = chunk.slice(leading.length);
		const previous = result.at(-1);
		if (previous != null && leading !== '') {
			result[result.length - 1] = previous + leading;
		}
		if (body !== '') {
			result.push(body);
		}
	}

	return result;
};

export const toChunks = (value: string): string[] => normalizeChunks(parser.parse(value));
