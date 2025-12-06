import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactCompiler: true,
	typescript: {
		tsconfigPath: 'tsconfig.next.json',
	},
	turbopack: {
		rules: {
			'*.{ts,tsx,js,jsx}': {
				loaders: [
					{
						loader: path.resolve(import.meta.dirname, './dist/index.mjs'),
						options: {
							sourceMap: process.env.NODE_ENV !== 'production',
							displayName: process.env.NODE_ENV !== 'production',
							babelOptions: {
								presets: ['next/babel', '@wyw-in-js'],
							},
						},
					},
				],
			},
		},
	},
};

export default nextConfig;
