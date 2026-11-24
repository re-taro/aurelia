import type { Post } from './definitions';

type PostProperties = Partial<Omit<Post, 'data'>> & { data?: Partial<Post['data']> };

export const createPost = (properties: PostProperties = {}): Post => ({
	id: '',
	collection: 'posts',
	...properties,
	data: {
		title: '',
		description: '',
		tags: [],
		publishedAt: '',
		...properties.data,
	},
});
