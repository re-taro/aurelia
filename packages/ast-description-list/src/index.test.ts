/* eslint-disable ts/no-non-null-assertion */

import { dedent } from '@qnighy/dedent';
import { remarkDescriptionList } from 'remark-description-list';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { astDescriptionList } from '.';

describe('remarkDescriptionList', () => {
	const transformer = unified().use(remarkParse).use(remarkDescriptionList).use(astDescriptionList).freeze();

	it('should transform `list` to `descriptionList` (from AST)', async () => {
		const markdown = dedent`\
			- term 1:
				- details 1
				- details 2
			- term 2:
				- details 3
		`;

		const result = await transformer.run(transformer.parse(markdown).children.at(0)!);

		expect(result).toMatchSnapshot();
	});

	it('should transform `list` to `descriptionList` with multiple terms (from AST)', async () => {
		const markdown = dedent`\
			- term 1:
			- term 2:
				- details 1
				- details 2
		`;

		const result = await transformer.run(transformer.parse(markdown).children.at(0)!);

		expect(result).toMatchSnapshot();
	});
});
