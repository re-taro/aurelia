import { dedent } from '@qnighy/dedent';
import { astTransform } from 'ast-transform';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { astToc } from '.';

describe('astToc', () => {
	it('collect heading (from AST)', async () => {
		const transformer = unified().use(remarkParse).use(astTransform).use(astToc).freeze();
		const markdown = dedent`\
      # Heading 1

      Paragraph 1

      ## Heading 2

      Paragraph 2

      Paragraph 3
    `;

		const result = await transformer.run(transformer.parse(markdown));

		expect(result).toMatchSnapshot();
	});
});
