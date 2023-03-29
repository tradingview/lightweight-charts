// eslint-env node

module.exports = [
	{
		name: 'CJS',
		path: 'dist/lightweight-charts.production.cjs',
		limit: '45.05 KB',
	},
	{
		name: 'ESM',
		path: 'dist/lightweight-charts.production.mjs',
		limit: '46.0 KB',
	},
	{
		name: 'Standalone-ESM',
		path: 'dist/lightweight-charts.standalone.production.mjs',
		limit: '46.70 KB',
	},
	{
		name: 'Standalone',
		path: 'dist/lightweight-charts.standalone.production.js',
		limit: '46.75 KB',
	},
];
