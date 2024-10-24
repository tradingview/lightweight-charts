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
		name: 'ESM Standalone',
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
	{
		name: 'Plugin: Text Watermark',
		path: 'dist/lightweight-charts.production.mjs',
		import: '{ createTextWatermark }',
		ignore: ['fancy-canvas'],
		limit: '2.00 KB',
		brotli: true,
	},
	{
		name: 'Plugin: Image Watermark',
		path: 'dist/lightweight-charts.production.mjs',
		import: '{ createImageWatermark }',
		ignore: ['fancy-canvas'],
		limit: '2.00 KB',
		brotli: true,
	},
	{
		name: 'Plugin: Series Markers',
		path: 'dist/lightweight-charts.production.mjs',
		import: '{ createSeriesMarkers }',
		ignore: ['fancy-canvas'],
		limit: '4.08 KB',
		brotli: true,
	},
	{
		name: 'Series',
		path: 'dist/lightweight-charts.production.mjs',
		import: '{ LineSeries, BaselineSeries, AreaSeries, BarSeries, CandlestickSeries, HistogramSeries }',
		ignore: ['fancy-canvas'],
		limit: '5.5 KB',
		brotli: true,
	},
];
