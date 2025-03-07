/*
	End result should be 4 visible bars, 1 whitespace, and finally 1 visible bar.
*/
function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const mainSeries = chart.addSeries(LightweightCharts.CandlestickSeries);

	mainSeries.setData([
		{ time: '2019-01-01', open: 10, high: 25, low: 5, close: 20 },
		{ time: '2019-01-02', open: 10, high: 25, low: 5, close: 20 },
		{ time: '2019-01-03', open: 10, high: 25, low: 5, close: 20 },
		{ time: '2019-01-04', open: 10, high: 25, low: 5, close: 20 },
		{ time: '2019-01-06', open: 10, high: 25, low: 5, close: 20 },
	]);

	mainSeries.update({ time: '2019-01-06' }); // replace the latest bar with whitespace
	mainSeries.update({ time: '2019-01-07' }); // add new whitespace
	mainSeries.update({ time: '2019-01-07', open: 10, high: 25, low: 5, close: 20 }); // replace the last whitespace with bar
}
