import type * as AstroContent from 'astro:content';

type ContentCollectionClient = typeof AstroContent;

type ContentCollectionEndpoint<P, R> = (cc: ContentCollectionClient, params: P) => Promise<R>;

export type InfraClient<T extends Record<string, [request: unknown, response: unknown]>> = {
	[P in keyof T]: ContentCollectionEndpoint<T[P][0], T[P][1]>;
};

type AnyInfraClient = InfraClient<Record<string, [request: never, response: unknown]>>;

type InfraClientMethodMap<T extends AnyInfraClient> = {
	[P in keyof T]: ContentCollectionEndpoint<
		T[P] extends ContentCollectionEndpoint<infer U, unknown> ? U : never,
		T[P] extends ContentCollectionEndpoint<never, infer S> ? S : never
	>;
};

export const createInfraClient = <T extends AnyInfraClient>(methods: InfraClientMethodMap<T>): T =>
	({ ...methods }) as T;
