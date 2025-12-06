import type { LinariaLoaderOptions } from '../types';
import type { transform } from '@wyw-in-js/transform';
import type { RawLoaderDefinitionFunction } from 'webpack';

type LoaderType = RawLoaderDefinitionFunction<LinariaLoaderOptions & { name: string }>;

export const convertSourceMap = (
	value: Parameters<LoaderType>[1],
): Parameters<typeof transform>[0]['options']['inputSourceMap'] => {
	if (typeof value === 'string' || value == null) {
		return undefined;
	}

	return {
		...value,
		file: value.file,
		mappings: value.mappings,
		names: value.names,
		sources: value.sources,
		version: value.version,
	};
};
