import CssModuleButton from '../components/client/CSSModuleLink';
import LinariaLink from '../components/client/LinariaLink';
import ServerContainer from '../components/server/ServerContainer';
import type { JSX } from 'react';

export default function Home(): JSX.Element {
	return (
		<ServerContainer>
			<CssModuleButton />
			<LinariaLink />
		</ServerContainer>
	);
}
