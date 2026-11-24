type SnakeToDot<S extends string> = S extends `${infer H}_${infer T}` ? `${H}.${SnakeToDot<T>}` : S;
type DotCase<S extends string> = Lowercase<SnakeToDot<S>>;
export type DotCaseKeys<T> = { [K in keyof T as DotCase<K & string>]: T[K] };

export type EnumLike<T extends Record<string, unknown>> = string extends T[keyof T]
	? never
	: number extends T[keyof T]
		? never
		: T[keyof T];
