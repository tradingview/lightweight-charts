// fix the second case from
// https://github.com/tradingview/lightweight-charts/issues/110

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const areaSeries = chart.addAreaSeries();
	const volumeSeries = chart.addHistogramSeries();

	volumeSeries.update(
		{ time: '2019-05-24', value: 23714686.00 }
	);

	areaSeries.setData([
		{ time: '2019-05-24', value: 179.66 },
	]);
}
