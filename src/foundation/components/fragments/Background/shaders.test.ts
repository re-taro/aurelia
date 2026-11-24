import { minify } from 'vite-plugin-glsl';
import { describe, expect, test } from 'vitest';

import common from './shaders/common.glsl?raw';
import dustVertex from './shaders/dust.vert?raw';
import jellyVertex from './shaders/jelly.vert?raw';
import particleFragment from './shaders/particle.frag?raw';

const OPERATORS = `
	<<= >>=
	++ -- << >> <= >= == != && || ^^ += -= *= /= %= &= |= ^=
	( ) [ ] { } . , ; : ? + - * / % < > = ! ~ & | ^
`
	.trim()
	.split(/\s+/u);
const IDENTIFIER = /[A-Za-z_]\w*/uy;
const NUMBER = /0[xX][\da-fA-F]+[uU]?|(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?[uUfF]?/uy;

const matchAt = (pattern: RegExp, line: string, at: number): string | undefined => {
	pattern.lastIndex = at;
	return pattern.exec(line)?.[0];
};

const operatorAt = (line: string, at: number): string | undefined =>
	OPERATORS.find((operator) => line.startsWith(operator, at));

const tokenize = (source: string): string[] => {
	const tokens: string[] = [];
	const code = source.replaceAll(/\/\*[\s\S]*?\*\//gu, ' ').replaceAll(/\/\/.*$/gmu, '');
	for (const raw of code.split('\n')) {
		const line = raw.trim();
		if (line.startsWith('#')) {
			tokens.push(line.replaceAll(/\s+/gu, ' '));
			continue;
		}
		let at = 0;
		while (at < line.length) {
			if (/\s/u.test(line.charAt(at))) {
				at += 1;
				continue;
			}
			const token = matchAt(IDENTIFIER, line, at) ?? matchAt(NUMBER, line, at) ?? operatorAt(line, at);
			if (token === undefined) {
				throw new Error(`解釈できない文字 ${JSON.stringify(line.charAt(at))}: ${line}`);
			}
			tokens.push(token);
			at += token.length;
		}
	}
	return tokens;
};

const SHADERS = Object.entries({
	'common.glsl': common,
	'dust.vert': dustVertex,
	'jelly.vert': jellyVertex,
	'particle.frag': particleFragment,
});

describe('shader minify', () => {
	test.each(SHADERS)('%s は縮めても字句の並びが変わらない', (_, source) => {
		const minified = minify(source);
		expect(tokenize(minified)).toStrictEqual(tokenize(source));
		expect(minified.length).toBeLessThan(source.length);
	});
});
