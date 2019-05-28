// @ts-check

/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {
	compilationOptions: {
		preferredConfigPath: './tsconfig.all-non-composite.json',
	},
	entries: [
		{
			filePath: './src/index.ts',
			outFile: './dist/typings.d.ts',
			output: {
				sortNodes: true,
			},
		},
	],
};

module.exports = config;
