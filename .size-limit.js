// eslint-env node

// eslint-disable-next-line import/no-default-export
export default [
	{
		name: 'ESM',
		path: 'dist/lightweight-charts.production.mjs',
		limit: '49.82 KB',
		gzip: true,
	},
	{
		name: 'Standalone-ESM',
		path: 'dist/lightweight-charts.standalone.production.mjs',
		limit: '51.60 KB',
		gzip: true,
	},
	{
		name: 'Standalone',
		path: 'dist/lightweight-charts.standalone.production.js',
		limit: '51.66 KB',
		gzip: true,
	},
];
