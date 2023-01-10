const terser = require('rollup-plugin-terser').terser;
const nodeResolve = require('@rollup/plugin-node-resolve').default;
const replace = require('@rollup/plugin-replace');
const packageJson = require('./package.json');

function getDevBuildMetadata() {
	const now = new Date();
	return now.toISOString().replace(/:\d+\..+/g, '').replace(/[-T:]/g, '');
}

function getCurrentVersion() {
	const isDev = process.env.BUILD_TAG !== 'release';
	return `${packageJson.version}` + (isDev ? `-dev+${getDevBuildMetadata()}` : '');
}

const currentVersion = getCurrentVersion();

function getConfig(inputFile, type, isProd) {
	const isModular = type === 'module';
	const suffix = isModular ? 'esm' : 'standalone';
	const mode = isProd ? 'production' : 'development';

	const config = {
		input: inputFile,
		output: {
			format: isModular ? 'esm' : 'iife',
			file: `./dist/lightweight-charts.${suffix}.${mode}.js`,
			banner: `
/*!
 * @license
 * TradingView Lightweight Charts v${currentVersion}
 * Copyright (c) 2022 TradingView, Inc.
 * Licensed under Apache License 2.0 https://www.apache.org/licenses/LICENSE-2.0
 */`.trim(),
		},
		plugins: [
			nodeResolve(),
			replace({
				preventAssignment: true,
				values: {
					// make sure that this values are synced with src/typings/globals/index.d.ts
					'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
					'process.env.BUILD_VERSION': JSON.stringify(currentVersion),
				},
			}),
			isProd && terser({
				output: {
					comments: /@license/,
					// eslint-disable-next-line camelcase
					inline_script: true,
				},
				mangle: {
					module: (type === 'module'),
					properties: {
						regex: /^_(private|internal)_/,
					},
				},
			}),
		],
		external: id => isModular && /^fancy-canvas(\/.+)?$/.test(id),
	};

	return config;
}

const configs = [
	getConfig('./lib/prod/src/index.js', 'module', false),
	getConfig('./lib/prod/src/standalone.js', 'standalone', false),
];

if (process.env.NODE_ENV === 'production') {
	configs.push(
		getConfig('./lib/prod/src/index.js', 'module', true),
		getConfig('./lib/prod/src/standalone.js', 'standalone', true)
	);
}

// eslint-disable-next-line no-console
console.log(`Building version: ${currentVersion}`);

module.exports = configs;
