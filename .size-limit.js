// eslint-env node

// We should set these values as 0.01 higher than the number we get when running the size check.
// The reason is that the size can change very slightly on each build because we include the build date as a comment in the output.
// This seems to affect the compressed size (some dates are more compressible than others).

module.exports = [
	{
		name: 'CJS',
		path: 'dist/lightweight-charts.production.cjs',
		limit: '47.69 KB',
	},
	{
		name: 'ESM',
		path: 'dist/lightweight-charts.production.mjs',
		limit: '47.64 KB',
	},
	{
		name: 'Standalone-ESM',
		path: 'dist/lightweight-charts.standalone.production.mjs',
		limit: '49.37 KB',
	},
	{
		name: 'Standalone',
		path: 'dist/lightweight-charts.standalone.production.js',
		limit: '49.41 KB',
	},
];
