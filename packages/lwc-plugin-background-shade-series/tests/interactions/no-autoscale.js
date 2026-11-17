// The shade's values take no part in the price scale, even when the shade is
// put on the line's own scale: adding it next to a line series around 1000
// leaves the scale where the line put it, and it shows no last value label.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const chart = LightweightCharts.createChart(container);
	const times = Array.from({ length: 20 }, (_, i) => 1704067200 + i * 86400);
	const line = chart.addSeries(LightweightCharts.LineSeries);
	line.setData(times.map((time, i) => ({ time, value: 1000 + i })));
	chart.timeScale().fitContent();
	await frames();
	const before = [1000, 1019].map(value => line.priceToCoordinate(value));

	const shade = LwcPlugin.createBackgroundShadeSeries(chart, { priceScaleId: 'right' });
	shade.setData(times.map((time, i) => ({ time, value: i * 5 })));
	await frames();
	const after = [1000, 1019].map(value => line.priceToCoordinate(value));
	if (JSON.stringify(before) !== JSON.stringify(after)) {
		throw new Error(`The shade changed the price scale: ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
	}
	if (shade.options().lastValueVisible || shade.options().priceLineVisible) {
		throw new Error('The shade shows a last value label or a price line by default');
	}
}
