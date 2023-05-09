// eslint-env node

module.exports = [
	{
		name: 'CJS',
		path: 'dist/lightweight-charts.production.cjs',
		limit: '43.18 KB',
	},
	{
		name: 'ESM',
		path: 'dist/lightweight-charts.production.mjs',
		limit: '43.09 KB',
	},
	{
		name: 'Standalone-ESM',
		path: 'dist/lightweight-charts.standalone.production.mjs',
		limit: '44.81 KB',
	},
	{
		name: 'Standalone',
		path: 'dist/lightweight-charts.standalone.production.js',
		limit: '44.85 KB',
	},
];
