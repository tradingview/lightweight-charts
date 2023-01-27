// eslint-env node

module.exports = [
	{
		name: 'CJS',
		path: 'dist/lightweight-charts.production.cjs',
		limit: '44.1 KB',
	},
	{
		name: 'ESM',
		path: 'dist/lightweight-charts.production.mjs',
		limit: '44.0 KB',
	},
	{
		name: 'Standalone-ESM',
		path: 'dist/lightweight-charts.standalone-esm.production.js',
		limit: '45.8 KB',
	},
	{
		name: 'Standalone',
		path: 'dist/lightweight-charts.standalone.production.js',
		limit: '45.8 KB',
	},
];
