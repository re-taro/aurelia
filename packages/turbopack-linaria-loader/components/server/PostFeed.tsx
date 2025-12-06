import { styled } from '@linaria/react';
import type { JSX } from 'react';

async function loadPosts(): Promise<{ posts: string[] }> {
	return await new Promise((resolve) => {
		setTimeout(() => {
			resolve({ posts: ['Post A', 'Post B', 'Post C'] });
		}, 1000);
	});
}

const Post = styled.h3`
	border: 1rem solid;
	border-color: brown;
	content: 'Linaria Post';
`;

export default async function PostFeed(): Promise<JSX.Element> {
	const posts = await loadPosts();

	return (
		<div>
			{posts.posts.map((post) => (
				<Post key={post} data-testid="linaria-post">
					{post}
				</Post>
			))}
		</div>
	);
}
