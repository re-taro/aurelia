import path from 'node:path';
import { transform, TransformCacheCollection } from '@wyw-in-js/transform';
import { performFastCheck } from './utils/fast-check';
import { insertImportStatement } from './utils/insert-import';
import { convertSourceMap } from './utils/source-map';
import type { LinariaTransformLoaderOptions } from './types';
import type { Result } from '@wyw-in-js/transform';
import type { PartialServices } from '@wyw-in-js/transform/types/transform/helpers/withDefaultServices';
import type { RawLoaderDefinitionFunction } from 'webpack';

type LoaderType = RawLoaderDefinitionFunction<LinariaTransformLoaderOptions>;

const cache = new TransformCacheCollection();

const turbopackTransformLoader: LoaderType = function (content, inputSourceMap) {
	this.async();

	const { fastCheck = true, prefixer = true, ...pluginOptions } = this.getOptions();

	const contentStr = content.toString();

	// Use the performFastCheck utility function
	if (!performFastCheck(contentStr, fastCheck)) {
		this.callback(null, contentStr, inputSourceMap);
		return;
	}

	const asyncResolve = async (token: string, importer: string): Promise<string> => {
		const context =
			path.isAbsolute(importer) ? path.dirname(importer) : path.join(process.cwd(), path.dirname(importer));
		try {
			// The options object is required in turbopack
			const resolve = this.getResolve({});

			const result = await resolve(context, token);

			if (result) {
				this.addDependency(result);
				return result;
			}
			throw new Error(`Cannot resolve ${token} from ${context}`);
		} catch (error) {
			console.error(`Error resolving ${token} from ${context}:`, error);
			throw error instanceof Error ? error : new Error(String(error));
		}
	};

	const transformServices: PartialServices = {
		options: {
			filename: this.resourcePath,
			inputSourceMap: convertSourceMap(inputSourceMap),
			root: process.cwd(),
			prefixer,
			pluginOptions,
		},
		cache,
	} as PartialServices;

	transform(transformServices, contentStr, asyncResolve)
		.then(async (result: Result) => {
			if (result.cssText) {
				await Promise.all(result.dependencies?.map(async (dep) => await asyncResolve(dep, this.resourcePath)) ?? []);

				const css = Buffer.from(result.cssText).toString('base64');
				const importStatement = `import "data:text/css;base64,${css}";`;
				const finalCode = insertImportStatement(result.code, importStatement);

				this.callback(null, finalCode, result.sourceMap ?? undefined);
				return;
			}

			// eslint-disable-next-line promise/always-return
			this.callback(null, result.code, result.sourceMap ?? undefined);
		})
		.catch((error: unknown) => {
			if (error instanceof Error) {
				this.callback(error);
			}
		});
};

export default turbopackTransformLoader;
