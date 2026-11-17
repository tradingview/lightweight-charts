async function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	});
	const first = chart.addSeries(LightweightCharts.LineSeries);
	const second = chart.addSeries(LightweightCharts.LineSeries, {}, 1);
	first.setData([
		{ time: '2024-01-01', value: 10 },
		{ time: '2024-01-02', value: 20 },
		{ time: '2024-01-03', value: 15 },
	]);
	second.setData([
		{ time: '2024-01-01', value: 10 },
		{ time: '2024-02-01', value: 20 },
	]);
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	chart.removePane(1);
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
