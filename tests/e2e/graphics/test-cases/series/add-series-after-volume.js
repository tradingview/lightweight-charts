// fix the first case from
// https://github.com/tradingview/lightweight-charts/issues/110

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const areaSeries = chart.addAreaSeries(); // or any other series type
	const volumeSeries = chart.addHistogramSeries();

	volumeSeries.setData([
		{ time: '2019-05-24', value: 23714686.00, color: 'red' },
	]);

	areaSeries.setData([
		{ time: '2019-05-24', value: 179.66 },
	]);
}
