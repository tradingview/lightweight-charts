async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);
	const series = LwcPlugin.createStackedBarsSeries(chart);
	series.setData([{ time: '2024-01-01', values: [10, -20], tag: 'kept' }]);
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	series.applyOptions({ stackOrder: 'reverse', base: 50 });
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	for (const value of [30, 40, 50]) {
		const y = series.priceToCoordinate(value);
		if (y === null || y < 0 || y > chart.paneSize().height) {
			throw new Error(`Price ${value} is outside the pane after applyOptions: ${y}`);
		}
	}
	if (series.data()[0].tag !== 'kept') { throw new Error('Option changes lost custom data fields'); }
}
