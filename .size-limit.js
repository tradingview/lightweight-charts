// eslint-env node

// eslint-disable-next-line import/no-default-export
export default [
	{
		name: 'ESM',
		path: 'dist/lightweight-charts.production.mjs',
		limit: '49.81 KB',
		gzip: true,
	},
	{
		name: 'Standalone-ESM',
		path: 'dist/lightweight-charts.standalone.production.mjs',
		limit: '51.57 KB',
		gzip: true,
	},
	{
		name: 'Standalone',
		path: 'dist/lightweight-charts.standalone.production.js',
		limit: '51.63 KB',
		gzip: true,
	},
];
