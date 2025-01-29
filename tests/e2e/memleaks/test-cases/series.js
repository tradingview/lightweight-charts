/**
 * This test takes an existing chart and adds a variety of series
 * and then removes these series. Tests if there is any memory leak
 * resulting from the creation and removal of series.
 */

/** @type {import('@memlab/core/dist/lib/Types').IScenario} */
export const scenario = {
	allowedLeaks: [
		'FormattedLabelsCache',
		'CrosshairPriceAxisView', // <- We should check and maybe fix this?
		'PriceAxisViewRenderer', // <- (part of the same leak above)
	],
	setup: async function(page) {
		await page.addScriptTag({
			url: 'library.js',
		});
		await page.evaluate(() => {
			window.chart = LightweightCharts.createChart(
				document.getElementById('container')
			);
		});
	},
	action: async function(page) {
		await page.evaluate(() => {
			function generateData() {
				const res = [];
				const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
				for (let i = 0; i < 500; ++i) {
					res.push({
						time: time.getTime() / 1000,
						value: i,
					});
					time.setUTCDate(time.getUTCDate() + 1);
				}
				return res;
			}
			function generateBars(count = 500, startDay = 15) {
				const res = [];
				const time = new Date(Date.UTC(2018, 0, startDay, 0, 0, 0, 0));
				for (let i = 0; i < count; ++i) {
					const step = (i % 20) / 5000;
					const base = i / 5;

					res.push({
						time: time.getTime() / 1000,
						open: base * (1 - step),
						high: base * (1 + 2 * step),
						low: base * (1 - 2 * step),
						close: base * (1 + step),
					});

					time.setUTCDate(time.getUTCDate() + 1);
				}

				return res;
			}
			if (window.chart) {
				window.lineSeries = window.chart.addSeries(LightweightCharts.LineSeries);
				window.lineSeries.setData(generateData());
				window.areaSeries = window.chart.addSeries(LightweightCharts.AreaSeries);
				window.areaSeries.setData(generateData());
				window.baselineSeries = window.chart.addSeries(LightweightCharts.BaselineSeries);
				window.baselineSeries.setData(generateData());
				window.histogramSeries = window.chart.addSeries(LightweightCharts.HistogramSeries);
				window.histogramSeries.setData(generateData());

				window.barSeries = window.chart.addSeries(LightweightCharts.BarSeries);
				window.barSeries.setData(generateBars());
				window.candlestickSeries = window.chart.addSeries(LightweightCharts.CandlestickSeries);
				window.candlestickSeries.setData(generateBars());
			}
		});
	},
	back: async function(page) {
		await page.evaluate(() => {
			if (window.chart) {
				window.chart.removeSeries(window.lineSeries);
				delete window.lineSeries;
				window.chart.removeSeries(window.areaSeries);
				delete window.areaSeries;
				window.chart.removeSeries(window.baselineSeries);
				delete window.baselineSeries;
				window.chart.removeSeries(window.histogramSeries);
				delete window.histogramSeries;

				window.chart.removeSeries(window.barSeries);
				delete window.barSeries;
				window.chart.removeSeries(window.candlestickSeries);
				delete window.candlestickSeries;
			}
		});
	},
};
