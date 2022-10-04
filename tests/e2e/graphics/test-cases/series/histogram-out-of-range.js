// see https://github.com/tradingview/lightweight-charts/issues/133

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);
	const series = chart.addCandlestickSeries();

	series.setData([
		{ time: '2018-12-06', open: 141.77, high: 170.39, low: 120.25, close: 145.72 },
		{ time: '2018-12-07', open: 145.72, high: 147.99, low: 100.11, close: 108.19 },
		{ time: '2018-12-08', open: 108.19, high: 118.43, low: 74.22, close: 75.16 },
		{ time: '2018-12-09', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
		{ time: '2018-12-10', open: 45.12, high: 53.90, low: 45.12, close: 48.09 },
		{ time: '2018-12-11', open: 60.71, high: 60.71, low: 53.39, close: 59.29 },
		{ time: '2018-12-12', open: 68.26, high: 68.26, low: 59.04, close: 60.50 },
		{ time: '2018-12-13', open: 67.71, high: 105.85, low: 66.67, close: 91.04 },
		{ time: '2018-12-14', open: 91.04, high: 121.40, low: 82.70, close: 111.40 },
		{ time: '2018-12-15', open: 111.51, high: 142.83, low: 103.34, close: 131.25 },
		{ time: '2018-12-16', open: 131.33, high: 151.17, low: 77.68, close: 96.43 },
		{ time: '2018-12-17', open: 106.33, high: 110.20, low: 90.39, close: 98.10 },
		{ time: '2018-12-18', open: 109.87, high: 114.69, low: 85.66, close: 111.26 },
		{ time: '2018-12-19', open: 141.77, high: 170.39, low: 120.25, close: 145.72 },
		{ time: '2018-12-20', open: 145.72, high: 147.99, low: 100.11, close: 108.19 },
		{ time: '2018-12-21', open: 108.19, high: 118.43, low: 74.22, close: 75.16 },
		{ time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
		{ time: '2018-12-23', open: 45.12, high: 53.90, low: 45.12, close: 48.09 },
		{ time: '2018-12-24', open: 60.71, high: 60.71, low: 53.39, close: 59.29 },
		{ time: '2018-12-25', open: 68.26, high: 68.26, low: 59.04, close: 60.50 },
		{ time: '2018-12-26', open: 67.71, high: 105.85, low: 66.67, close: 91.04 },
		{ time: '2018-12-27', open: 91.04, high: 121.40, low: 82.70, close: 111.40 },
		{ time: '2018-12-28', open: 111.51, high: 142.83, low: 103.34, close: 131.25 },
		{ time: '2018-12-29', open: 131.33, high: 151.17, low: 77.68, close: 96.43 },
		{ time: '2018-12-30', open: 106.33, high: 110.20, low: 90.39, close: 98.10 },
		{ time: '2018-12-31', open: 109.87, high: 114.69, low: 85.66, close: 111.26 },
	]);

	const histogramSeries = chart.addHistogramSeries({
		color: 'yellow',
	});

	histogramSeries.setData([
		{ time: '2018-12-01', value: 20.27 },
		{ time: '2018-12-02', value: 10.28 },
		{ time: '2018-12-03', value: 19.29 },
		{ time: '2018-12-04', value: 30.64 },
		{ time: '2018-12-05', value: 17.46 },
		{ time: '2018-12-06', value: 10.55 },
		{ time: '2018-12-07', value: 14.85 },
		{ time: '2018-12-08', value: 20.68 },
		{ time: '2018-12-09', value: 35.60 },
		{ time: '2018-12-10', value: 40.31 },
		{ time: '2018-12-11', value: 25.33 },
		{ time: '2018-12-12', value: 14.85 },
	]);

	chart.timeScale().setVisibleRange({
		from: (new Date(Date.UTC(2018, 11, 1, 0, 0, 0, 0))).getTime() / 1000,
		to: (new Date(Date.UTC(2018, 11, 31, 0, 0, 0, 0))).getTime() / 1000,
	});

	return new Promise(resolve => {
		setTimeout(() => {
			chart.timeScale().setVisibleRange({
				from: (new Date(Date.UTC(2018, 11, 14, 0, 0, 0, 0))).getTime() / 1000,
				to: (new Date(Date.UTC(2018, 11, 31, 0, 0, 0, 0))).getTime() / 1000,
			});

			resolve();
		}, 1000);
	});
}
