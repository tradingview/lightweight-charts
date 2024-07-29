// eslint-env node

/**
 * @type {import('size-limit').SizeLimitConfig}
*/
// eslint-disable-next-line import/no-default-export
export default [
	{
		name: 'ESM',
		path: 'dist/lightweight-charts.production.mjs',
		limit: '45.00 KB',
		import: '*',
		ignore: ['fancy-canvas'],
		brotli: true,
	},
	{
		name: 'ESM createChart',
		path: 'dist/lightweight-charts.production.mjs',
		limit: '45.00 KB',
		import: '{ createChart }',
		ignore: ['fancy-canvas'],
		brotli: true,
	},
	{
		name: 'ESM createChartEx',
		path: 'dist/lightweight-charts.production.mjs',
		limit: '45.00 KB',
		import: '{ createChartEx }',
		ignore: ['fancy-canvas'],
		brotli: true,
	},
	{
		name: 'Standalone-ESM',
		path: 'dist/lightweight-charts.standalone.production.mjs',
		limit: '50.00 KB',
		import: '*',
		brotli: true,
	},
	{
		name: 'Standalone',
		path: 'dist/lightweight-charts.standalone.production.js',
		limit: '50.00 KB',
		brotli: true,
	},
];
