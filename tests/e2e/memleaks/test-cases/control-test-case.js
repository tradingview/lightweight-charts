/**
 * This test verifies that memlab doesn't detect instances which
 * are still in use.
 *
 * We are creating a chart before the `action` and don't make any
 * changes during the `action` and `back` actions therefore the chart will
 * still be present.
 */

/** @type {import('@memlab/core/dist/lib/Types').IScenario} */
export const scenario = {
	setup: async function(page) {
		await page.addScriptTag({
			url: 'library.js',
		});
		await page.evaluate(() => {
			window.chart = LightweightCharts.createChart(
				document.getElementById('container')
			);
			const mainSeries = window.chart.addSeries(LightweightCharts.LineSeries);
			mainSeries.setData([
				{ time: 0, value: 1 },
				{ time: 1, value: 2 },
			]);
		});
	},
	action: async function(page) {
		await page.evaluate(() => {});
	},
	back: async function(page) {
		await page.evaluate(() => {});
	},
};
