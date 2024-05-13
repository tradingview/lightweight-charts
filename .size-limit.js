// eslint-env node

module.exports = [
	{
		name: 'CJS',
		path: 'dist/lightweight-charts.production.cjs',
		limit: '48.28 KB',
	},
	{
		name: 'ESM',
		path: 'dist/lightweight-charts.production.mjs',
		limit: '48.22 KB',
	},
	{
		name: 'Standalone-ESM',
		path: 'dist/lightweight-charts.standalone.production.mjs',
		limit: '49.93 KB',
	},
	{
		name: 'Standalone',
		path: 'dist/lightweight-charts.standalone.production.js',
		limit: '49.98 KB',
	},
];
