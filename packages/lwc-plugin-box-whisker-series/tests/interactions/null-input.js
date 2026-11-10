// JSON has no NaN or undefined, so missing values arrive as null: a point with
// one of its five numbers `null` is whitespace, and `outliers: null` means no
// outliers. Neither throws, while setting the data or while drawing.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);
	const series = LwcPlugin.createBoxWhiskerSeries(chart);
	series.setData([
		{ time: '2024-01-01', min: 10, q1: 20, median: 30, q3: 40, max: 50, outliers: null },
		{ time: '2024-01-02', min: 11, q1: null, median: 31, q3: 41, max: 51 },
		{ time: '2024-01-03', min: 12, q1: 22, median: 32, q3: 42, max: 52, outliers: [null, 70] },
	]);
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	if (series.data().length !== 2) {
		throw new Error(`Expected the null point to be whitespace, got ${series.data().length} drawn points`);
	}
	const y = series.priceToCoordinate(70);
	if (y === null || y < 0 || y > chart.paneSize().height) {
		throw new Error(`The finite outlier is not autoscaled: ${y}`);
	}
}
