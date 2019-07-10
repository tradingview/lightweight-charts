// fix the first case from
// https://github.com/tradingview/lightweight-charts/issues/110

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var areaSeries = chart.addAreaSeries(); // or any other series type
	var volumeSeries = chart.addHistogramSeries();

	volumeSeries.setData([
		{ time: '2019-05-24', value: 23714686.00, color: 'red' },
	]);

	areaSeries.setData([
		{ time: '2019-05-24', value: 179.66 },
	]);
}
