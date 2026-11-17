// A JSON feed may send null for a missing cell, or for the whole cells array:
// null cells are skipped, and a point with no cell to draw is whitespace.
// Nothing throws.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);
	const series = LwcPlugin.createHeatmapSeries(chart);
	series.setData([
		{ time: '2024-01-01', cells: [null, { low: 0, high: 10, amount: 50 }] },
		{ time: '2024-01-02', cells: [null, { low: 0, high: 10, amount: NaN }] },
		{ time: '2024-01-03', cells: null },
		{ time: '2024-01-04', cells: 'not cells' },
		{ time: '2024-01-05', cells: [{ low: 10, high: 20, amount: 80 }] },
	]);
	series.update({ time: '2024-01-06', cells: null });
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	if (series.data().length !== 2) {
		throw new Error(`Expected the points with no cell to draw to be whitespace, got ${series.data().length} points`);
	}
}
