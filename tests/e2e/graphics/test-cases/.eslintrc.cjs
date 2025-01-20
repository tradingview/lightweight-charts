/* eslint-env node */

module.exports = {
	env: {
		browser: true,
		node: false,
	},
	rules: {
		'no-unused-vars': ['error', { varsIgnorePattern: '^(runTestCase|beforeInteractions|after(Initial|Final)Interactions|(initial|final)InteractionsToPerform)$', args: 'none' }],
	},
	globals: {
		LightweightCharts: false,
	},
};
