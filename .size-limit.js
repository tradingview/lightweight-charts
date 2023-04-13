// eslint-env node

module.exports = [
	{
		name: 'CJS',
		path: 'dist/lightweight-charts.production.cjs',
		limit: '46.15 KB',
	},
	{
		name: 'ESM',
		path: 'dist/lightweight-charts.production.mjs',
		limit: '46.10 KB',
	},
	{
		name: 'Standalone-ESM',
		path: 'dist/lightweight-charts.standalone.production.mjs',
		limit: '47.8 KB',
	},
	{
		name: 'Standalone',
		path: 'dist/lightweight-charts.standalone.production.js',
		limit: '47.85 KB',
	},
];
