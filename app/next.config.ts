import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
	turbopack: {
		rules: {
			'*.{ts,tsx,js,jsx}': {
				loaders: [
					{
						loader: 'turbopack-linaria-loader',
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
