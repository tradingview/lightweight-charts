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

function getConfig(inputFile, format, isProd) {
	const isStandalone = format === 'iife';
	const mode = isProd ? 'production' : 'development';
	const extension = {
		cjs: 'cjs',
		esm: 'mjs',
		iife: 'js',
	}[format];
	const config = {
		input: inputFile,
		output: {
			format,
			file: `./dist/lightweight-charts${isStandalone ? '.standalone' : ''}.${mode}.${extension}`,
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
					module: (format === 'esm' || format === 'cjs'),
					properties: {
						regex: /^_(private|internal)_/,
					},
				},
			}),
		],
		external: id => !isStandalone && /^fancy-canvas(\/.+)?$/.test(id),
	};

	return config;
}

const configs = [
	getConfig('./lib/prod/src/index.js', 'esm', false),
	getConfig('./lib/prod/src/index.js', 'cjs', false),
	getConfig('./lib/prod/src/standalone.js', 'iife', false),
];

if (process.env.NODE_ENV === 'production') {
	configs.push(
		getConfig('./lib/prod/src/index.js', 'esm', true),
		getConfig('./lib/prod/src/index.js', 'cjs', true),
		getConfig('./lib/prod/src/standalone.js', 'iife', true)
	);
}

// eslint-disable-next-line no-console
console.log(`Building version: ${currentVersion}`);

module.exports = configs;
