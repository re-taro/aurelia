import { css } from '@linaria/core';
import type { FC, PropsWithChildren } from 'react';

const containerStyle = css`
	padding: 2rem;
	display: flex;
	gap: 20px;
	content: 'Server Container';
	outline: 1rem solid transparent;
`;

const ServerContainer: FC<PropsWithChildren> = ({ children }) => {
	return (
		<>
			<h1>Server Component Container</h1>
			<div className={containerStyle} data-testid="server-container">
				{children}
			</div>
		</>
	);
};

export default ServerContainer;
