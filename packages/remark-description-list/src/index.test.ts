/* eslint-disable ts/no-non-null-assertion */

import { dedent } from '@qnighy/dedent';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { remarkDescriptionList } from '.';

describe('remarkDescriptionList', () => {
	const transformer = unified().use(remarkParse).use(remarkDescriptionList).freeze();

	it('should transform `list` to `descriptionList`', async () => {
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

	it('should transform `list` to `descriptionList` with multiple terms', async () => {
		const markdown = dedent`\
			- term 1:
			- term 2:
				- details 1
				- details 2
		`;

		const result = await transformer.run(transformer.parse(markdown).children.at(0)!);

		expect(result).toMatchSnapshot();
	});

	it('should not transform `list` to `descriptionList` if last term has not details', async () => {
		const markdown = dedent`\
			- term 1:
				- details 1
			- term 2:
				- details 2
			- term 3:
		`;

		const result = await transformer.run(transformer.parse(markdown).children.at(0)!);

		expect(result.type).toBe('list');
	});
});
