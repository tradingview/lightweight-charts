// @ts-check

/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {
	compilationOptions: {
		preferredConfigPath: './tsconfig.json',
	},
	entries: [
		{
			filePath: './src/index.ts',
			outFile: './dist/typings.d.ts',
			output: {
				sortNodes: true,
				respectPreserveConstEnum: true,
			},
		},
	],
};

module.exports = config;
