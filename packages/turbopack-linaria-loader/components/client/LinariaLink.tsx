'use client';
import { styled } from '@linaria/react';
import Link from 'next/link';
import type { JSX } from 'react';

const Container = styled.div`
	background-color: yellow;
	content: 'Linaria Link';
`;

export default function LinariaLink(): JSX.Element {
	return (
		<Link href="/posts" prefetch={false}>
			<Container data-testid="linaria-button">Linaria: Client Link</Container>
		</Link>
	);
}
