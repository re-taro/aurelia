import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export type PostsByYear = {
	year: number;
	posts: Post[];
};

export const GITHUB_PERMALINK_COMPONENT_NAME = 'aurelia-gh-perma-link';
