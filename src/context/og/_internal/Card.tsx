import type { FunctionalComponent, VNode } from 'preact';

import type { OgImageChunks } from '../definitions';

const COLOR_BACKGROUND = '#0b1215'; // GRAY_50
const COLOR_TEXT = '#ced0d0'; // GRAY_A
const COLOR_TEXT_SECONDARY = '#a4a6a6'; // GRAY_90
const COLOR_BRAND = '#c084fc'; // VIOLET_50

export const FONT_SANS = 'Noto Sans JP';
export const FONT_MONO = 'JetBrains Mono';

const renderChunks = (chunks: string[]): VNode[] =>
	chunks.map((chunk, index) => (
		// oxlint-disable-next-line react/no-array-index-key
		<span key={index} style={{ whiteSpace: 'pre-wrap' }}>
			{chunk}
		</span>
	));

export const Card: FunctionalComponent<OgImageChunks> = ({ title, text }) => (
	<div
		lang="ja-JP"
		style={{
			boxSizing: 'border-box',
			width: '100%',
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			padding: '96px 128px',
			backgroundColor: COLOR_BACKGROUND,
			color: COLOR_TEXT,
			fontFamily: FONT_SANS,
		}}>
		<div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					fontSize: '60px',
					fontWeight: 700,
					lineHeight: 1.25,
					overflow: 'hidden',
					maxHeight: '300px',
				}}>
				{renderChunks(title)}
			</div>
			{text != null && text.length > 0 && (
				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						color: COLOR_TEXT_SECONDARY,
						fontFamily: FONT_MONO,
						fontSize: '30px',
						fontWeight: 500,
						lineHeight: 1.2,
					}}>
					{renderChunks(text)}
				</div>
			)}
		</div>
		<div
			style={{
				color: COLOR_BRAND,
				fontFamily: FONT_MONO,
				fontSize: '30px',
				fontWeight: 500,
				lineHeight: 1,
			}}>
			blog.re-taro.dev
		</div>
	</div>
);
