function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } }));
	const first = chart.addSeries(LightweightCharts.LineSeries);
	const second = chart.addSeries(LightweightCharts.LineSeries);
	first.setData([{ time: '2025-01-01', value: 10 }]);

	const label = (coordinate, text, color) => ({
		coordinate: () => coordinate,
		text: () => text,
		textColor: () => '#FFFFFF',
		backColor: () => color,
	});

	const left = label(0, 'First', '#BB3355');
	const middle = label(40, 'Second', '#3344BB');
	const right = label(180, 'Separate', '#338855');
	first.attachPrimitive({ timeAxisViews: () => [left, right] });
	second.attachPrimitive({ timeAxisViews: () => [middle] });
}
