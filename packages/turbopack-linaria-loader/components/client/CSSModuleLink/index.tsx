'use client';
import Link from 'next/link';
import styles from './styles.module.css';
import type { JSX } from 'react';

export default function CssModuleLink(): JSX.Element {
	return (
		<Link href="/posts" prefetch={false} data-testid="css-module-button" className={styles['link']}>
			CssModule: Client Link
		</Link>
	);
}
