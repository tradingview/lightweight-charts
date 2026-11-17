// Changing `base` through applyOptions rescales the series without setting
// the data again, and keeps the fields a data item carries for the app.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const chart = LightweightCharts.createChart(container);
	const series = LwcPlugin.createGroupedBarsSeries(chart);
	series.setData([
		{ time: '2024-01-01', values: [10, 15], tag: 'kept' },
		{ time: '2024-01-02', values: [20, 5] },
	]);
	chart.timeScale().fitContent();
	await frames();
	series.applyOptions({ base: 100 });
	await frames();
	for (const value of [5, 20, 100]) {
		const y = series.priceToCoordinate(value);
		if (y === null || y < 0 || y > chart.paneSize().height) {
			throw new Error(`Price ${value} is outside the pane after applyOptions: ${y}`);
		}
	}
	if (series.data()[0].tag !== 'kept') {
		throw new Error('Option changes lost custom data fields');
	}
}
