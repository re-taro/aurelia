import type { Page } from '@playwright/test';

export type ErrorPattern = string | RegExp;

/**
 * 404 の応答。ブラウザは読み込みに失敗したリソースを console.error として出す
 */
export const NOT_FOUND_RESPONSE: ErrorPattern = 'the server responded with a status of 404';

const matches = (message: string, pattern: ErrorPattern): boolean =>
	typeof pattern === 'string' ? message.includes(pattern) : pattern.test(message);

/**
 * ページで捕捉されなかった例外と console.error を集める。
 * hydration の失敗や、読み込めなかったリソース (4xx / 5xx) もここで見つかる
 */
export const collectPageErrors = (page: Page, errors: string[]): void => {
	page.on('pageerror', (error) => {
		errors.push(`pageerror: ${error.message}`);
	});
	page.on('console', (message) => {
		if (message.type() === 'error') {
			errors.push(`console.error: ${message.text()} (${message.location().url})`);
		}
	});
};

export const findUnexpectedErrors = (errors: readonly string[], allowed: readonly ErrorPattern[]): string[] =>
	errors.filter((error) => !allowed.some((pattern) => matches(error, pattern)));
