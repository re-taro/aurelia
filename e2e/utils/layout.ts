import { expect, type Page } from '@playwright/test';

type Overflow = {
	scrollWidth: number;
	clientWidth: number;
	offenders: string[];
};

/**
 * ブラウザの中で動かす。ページの横幅と、画面の右端からはみ出している要素を調べる
 */
const measureOverflow = (): Overflow => {
	const { clientWidth, scrollWidth } = document.documentElement;
	// oxlint-disable-next-line unicorn/consistent-function-scoping
	const describe = (element: Element): string =>
		`<${element.localName}${element.id === '' ? '' : `#${element.id}`}${element.classList.length === 0 ? '' : `.${[...element.classList].join('.')}`}>`;
	// はみ出しの原因になっている、いちばん内側の要素だけを挙げる
	const offenders = [...document.body.querySelectorAll('*')]
		.filter((element) => element.getBoundingClientRect().right > clientWidth + 1)
		.filter((element, _, all) => !all.some((other) => other !== element && element.contains(other)))
		.slice(0, 10)
		.map((element) => describe(element));

	return { clientWidth, offenders, scrollWidth };
};

/**
 * 横スクロールが出ていないことを確かめる。長い単語や URL、表、コードがはみ出すとレイアウトが崩れる。
 * コードブロックのように、要素の中で横にスクロールさせるものは数えない
 */
export const expectNoHorizontalOverflow = async (page: Page): Promise<void> => {
	const { clientWidth, offenders, scrollWidth } = await page.evaluate(measureOverflow);

	expect(
		scrollWidth,
		`ページが横にはみ出しています (scrollWidth ${String(scrollWidth)} > clientWidth ${String(clientWidth)})。\n${offenders.join('\n')}`,
	).toBeLessThanOrEqual(clientWidth);
};
