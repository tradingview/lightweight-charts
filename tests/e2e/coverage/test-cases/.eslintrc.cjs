/* eslint-env node */

module.exports = {
	env: {
		browser: true,
		node: false,
	},
	rules: {
		'no-unused-vars': ['error', { varsIgnorePattern: '^(beforeInteractions|afterInteractions|interactionsToPerform)$', args: 'none' }],
	},
	globals: {
		LightweightCharts: false,
		generateLineData: false,
		generateHistogramData: false,
		generateBars: false,
	},
};
