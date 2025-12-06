import type { PluginOptions, Preprocessor } from '@wyw-in-js/transform';

export type LinariaTransformLoaderOptions = {
	/**
	 * Enables a quick syntax check to skip transform for files that don't contain Linaria code.
	 * This can significantly improve performance for large projects.
	 * @default true
	 */
	fastCheck?: boolean;
	/**
	 * Eanbles a prefixer for css rules.
	 * @default true
	 */
	prefixer?: boolean;
} & Partial<Omit<PluginOptions, 'sourceMaps'>>;

export type LinariaLoaderOptions = {
	/**
	 * Enables a quick syntax check to skip transform for files that don't contain Linaria code.
	 * This can significantly improve performance for large projects.
	 * @default false
	 */
	fastCheck?: boolean;
	/**
	 * Eanbles a prefixer for css rules.
	 * @default true
	 */
	prefixer?: boolean;
	preprocessor?: Preprocessor;
	sourceMap?: boolean;
} & Partial<PluginOptions>;
