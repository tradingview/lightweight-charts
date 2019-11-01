// fix the second case from
// https://github.com/tradingview/lightweight-charts/issues/110

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var areaSeries = chart.addAreaSeries();
	var volumeSeries = chart.addHistogramSeries();

	volumeSeries.update(
		{ time: '2019-05-24', value: 23714686.00 }
	);

	areaSeries.setData([
		{ time: '2019-05-24', value: 179.66 },
	]);
}
