import { styled } from '@linaria/react';
import { Suspense } from 'react';
import PostFeedComponent from '../../components/server/PostFeed';
import type { JSX } from 'react';

const Loading = styled.div`
	content: 'Linaria Loading CSS';
`;

export default function PostPage(): JSX.Element {
	return (
		<Suspense fallback={<Loading data-testid="linaria-loading">Loading feed...</Loading>}>
			<PostFeedComponent />
		</Suspense>
	);
}
