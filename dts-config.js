// @ts-check

/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {
	compilationOptions: {
		preferredConfigPath: './tsconfig.prod.json',
	},
	entries: [
		{
			filePath: './lib/prod/src/index.d.ts',
			outFile: './dist/typings.d.ts',
			output: {
				sortNodes: true,
				respectPreserveConstEnum: true,
			},
		},
	],
};

module.exports = config;
