// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var mainSeries = chart.addCandlestickSeries();

	mainSeries.setData([
		{ time: '2019-01-01', open: 10, high: 25, low: 5, close: 20 },
		{ time: '2019-01-02', open: 10, high: 25, low: 5, close: 20 },
		{ time: '2019-01-03', open: 10, high: 25, low: 5, close: 20 },
		{ time: '2019-01-04', open: 10, high: 25, low: 5, close: 20 },
		{ time: '2019-01-06', open: 10, high: 25, low: 5, close: 20 },
	]);

	mainSeries.update({ time: '2019-01-02' }); // replace existing bar with whitespace
	mainSeries.update({ time: '2019-01-05' }); // add new white space
}
