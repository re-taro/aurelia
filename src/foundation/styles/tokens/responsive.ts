import { MediaQuery } from './breakpoint';

export const breakpointKeys = ['base', 'mobile', 'tablet', 'desktop'] as const;
export type BreakpointKey = (typeof breakpointKeys)[number];

export type OverrideBreakpointKey = Exclude<BreakpointKey, 'base'>;

const overrideBreakpointKeys = ['mobile', 'tablet', 'desktop'] as const satisfies readonly OverrideBreakpointKey[];

export const BreakpointMediaQuery = {
	mobile: MediaQuery.MOBILE,
	tablet: MediaQuery.TABLET,
	desktop: MediaQuery.DESKTOP,
} as const satisfies Record<OverrideBreakpointKey, MediaQuery>;

export type TokenValue = string | Record<string, string>;

export type ResponsiveObject<T extends TokenValue> = { base: T } & Partial<Record<OverrideBreakpointKey, T>>;

export type ResponsiveValue<T extends TokenValue> = T | ResponsiveObject<T>;

export type ResponsiveTokenInput = Record<string, ResponsiveValue<TokenValue>>;

type UnwrapResponsiveValue<T> = T extends ResponsiveObject<infer U> ? U : T;

export type ResponsiveTokenValues<T extends ResponsiveTokenInput> = {
	[K in keyof T]: UnwrapResponsiveValue<T[K]>;
};

export type ResponsiveTokens<T extends ResponsiveTokenInput> = {
	/** contract / createGlobalTheme に渡す既定値 */
	base: ResponsiveTokenValues<T>;
	/** assignVars に渡す breakpoint ごとの上書き値 (上書きのある breakpoint のみ) */
	overrides: Partial<Record<OverrideBreakpointKey, ResponsiveTokenValues<T>>>;
};

/**
 * ResponsiveObject の判定 (兼 typeguard)
 */
export const isResponsiveObject = <T extends TokenValue>(value: ResponsiveValue<T>): value is ResponsiveObject<T> => {
	if (typeof value !== 'object') {
		return false;
	}

	const keys: readonly string[] = Object.keys(value);

	return keys.length > 0 && keys.every((key) => (breakpointKeys as readonly string[]).includes(key));
};

/**
 * ResponsiveValue で書かれた token 定義を vanilla-extract に渡せる形へ正規化する
 *
 * `overrides` は assignVars がすべての key を要求するため、指定のない値をより狭い breakpoint から埋めた
 * 完全な値の集合になる。上書きが一つも無い breakpoint は media query 自体を出力しないよう省かれる。
 */
export const defineResponsiveTokens = <const T extends ResponsiveTokenInput>(tokens: T): ResponsiveTokens<T> => {
	const entries: [string, ResponsiveObject<TokenValue>][] = Object.entries(tokens).map(([key, value]) => [
		key,
		isResponsiveObject(value) ? value : { base: value },
	]);

	const base = Object.fromEntries(entries.map(([key, value]) => [key, value.base])) as ResponsiveTokenValues<T>;

	const overrides: Partial<Record<OverrideBreakpointKey, ResponsiveTokenValues<T>>> = {};

	let inherited = base;
	for (const breakpoint of overrideBreakpointKeys) {
		const values = { ...inherited };
		let overridden = false;

		for (const [key, value] of entries) {
			const overriding = value[breakpoint];
			if (overriding == null) {
				continue;
			}

			(values as Record<string, TokenValue>)[key] = overriding;
			overridden = true;
		}

		inherited = values;

		if (overridden) {
			overrides[breakpoint] = values;
		}
	}

	return { base, overrides };
};

export const mapResponsiveOverrides = <T extends ResponsiveTokenInput, R>(
	tokens: ResponsiveTokens<T>,
	map: (values: ResponsiveTokenValues<T>, breakpoint: OverrideBreakpointKey) => R,
): Record<string, R> =>
	Object.fromEntries(
		overrideBreakpointKeys.flatMap((breakpoint) => {
			const values = tokens.overrides[breakpoint];

			return values == null ? [] : [[BreakpointMediaQuery[breakpoint], map(values, breakpoint)] as const];
		}),
	);
