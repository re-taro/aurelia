import { dedent } from '@qnighy/dedent';
import { astTransform } from 'ast-transform';
import { remarkEmbed } from 'remark-embed';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { astEmbed } from '.';

describe('astEmbed', () => {
	const transformer = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkEmbed)
		.use(astTransform)
		.use(astEmbed)
		.freeze();

	it('should transform orphan `link` to `embed` (from AST)', async () => {
		const markdown = dedent`\
			https://example.com

			https://www.youtube.com/watch?v=SHkF48SgiSA

			https://docs.google.com/presentation/d/1Jx4nQbzFk5BYTTZwuOMGQOd359G_orJU-OrG4Bg3ohg/edit?usp=sharing

			https://github.com/swc-project/swc/blob/f960d52364e72fa7548cc8aaaf6367dfdf7b9a8f/packages/core/postinstall.js

			https://github.com/styled-components/styled-components/blob/ef548a2fd1d8b7766a273084edb33caf7d8a37df/packages/styled-components/src/sheet/dom.ts#L13-L31
		`;

		const result = await transformer.run(transformer.parse(markdown));

		expect(result).toMatchSnapshot();
	});
	it('should not transform `link` to `embed` if parent is not `root` (from AST)', async () => {
		const markdown = dedent`\
			- https://example.com
		`;

		const result = await transformer.run(transformer.parse(markdown));

		expect(result).toMatchSnapshot();
	});
});
