import type { ElementContent, Root } from 'hast';
import { visit } from 'unist-util-visit';

const HEADING_TAG_PATTERN = /^h[1-6]$/u;

const toText = (nodes: ElementContent[]): string =>
	nodes
		.map((node) => {
			if (node.type === 'text') {
				return node.value;
			}
			if (node.type === 'element') {
				return toText(node.children);
			}
			return '';
		})
		.join('');

export const rehypeAureliaHeading =
	() =>
	(tree: Root): void => {
		visit(tree, 'element', (node) => {
			if (!HEADING_TAG_PATTERN.test(node.tagName)) {
				return;
			}
			const { id } = node.properties;
			if (id == null) {
				return;
			}
			const label = toText(node.children).trim();
			node.children.unshift({
				type: 'element',
				tagName: 'a',
				properties: {
					href: `#${id}`,
					ariaLabel: label === '' ? `#${id}` : label,
				},
				children: [],
			});
		});
	};
