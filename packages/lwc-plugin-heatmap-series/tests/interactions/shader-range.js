// The shader is handed the range of the amounts of the points in view: with
// the time scale showing only part of the data, the range covers what is on
// screen, not the whole series.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const chart = LightweightCharts.createChart(container);
	const ranges = [];
	const series = LwcPlugin.createHeatmapSeries(chart, {
		cellShader: (amount, range) => {
			ranges.push({ amount, min: range.min, max: range.max });
			return '#2962FF';
		},
	});
	const times = Array.from({ length: 60 }, (_, i) => 1704067200 + i * 86400);
	series.setData(times.map((time, i) => ({ time, cells: [{ low: 0, high: 10, amount: i }, { low: 10, high: 20, amount: i + 100 }] })));
	chart.timeScale().setVisibleLogicalRange({ from: 20, to: 30 });
	await frames();
	ranges.length = 0;
	series.applyOptions({ cellGap: 2 });
	await frames();
	if (ranges.length === 0) {
		throw new Error('The shader was not called');
	}
	for (const { amount, min, max } of ranges) {
		if (min < 18 || min > 20 || max < 130 || max > 132 || amount < min || amount > max) {
			throw new Error(`Expected a range of about 19 to 131 around every amount in view, got ${min} to ${max} for ${amount}`);
		}
	}
}
