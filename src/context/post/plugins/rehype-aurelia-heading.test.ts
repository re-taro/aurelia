import type { Element, Root } from 'hast';
import { describe, expect, test } from 'vitest';

import { rehypeAureliaHeading } from './rehype-aurelia-heading';

const heading = (tagName: string, id: string | undefined, children: Element['children']): Element => ({
	type: 'element',
	tagName,
	properties: id == null ? {} : { id },
	children,
});

const transform = (tree: Root): Root => {
	rehypeAureliaHeading()(tree);
	return tree;
};

describe('rehypeAureliaHeading', () => {
	test('見出しの先頭に、見出しテキストを aria-label に持つアンカーを挿入する', () => {
		const tree = transform({
			type: 'root',
			children: [heading('h2', 'intro', [{ type: 'text', value: 'はじめに' }])],
		});

		expect(tree.children[0]).toStrictEqual(
			heading('h2', 'intro', [
				{ type: 'element', tagName: 'a', properties: { href: '#intro', ariaLabel: 'はじめに' }, children: [] },
				{ type: 'text', value: 'はじめに' },
			]),
		);
	});

	test('ネストした要素を含む見出しでもテキストを結合して aria-label にする', () => {
		const tree = transform({
			type: 'root',
			children: [
				heading('h3', 'code', [
					{ type: 'text', value: 'foo ' },
					{ type: 'element', tagName: 'code', properties: {}, children: [{ type: 'text', value: 'bar' }] },
				]),
			],
		});

		const anchor = (tree.children[0] as Element).children[0] as Element;
		expect(anchor.properties).toStrictEqual({ href: '#code', ariaLabel: 'foo bar' });
	});

	test('id を持たない見出しには何もしない', () => {
		const tree = transform({
			type: 'root',
			children: [heading('h2', undefined, [{ type: 'text', value: 'no id' }])],
		});

		expect((tree.children[0] as Element).children).toHaveLength(1);
	});

	test('見出し以外の要素には何もしない', () => {
		const tree = transform({
			type: 'root',
			children: [
				{ type: 'element', tagName: 'p', properties: { id: 'p' }, children: [{ type: 'text', value: 'text' }] },
			],
		});

		expect((tree.children[0] as Element).children).toHaveLength(1);
	});
});
