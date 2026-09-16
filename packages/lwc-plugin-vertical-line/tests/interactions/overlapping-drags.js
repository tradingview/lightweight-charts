// The runner performs a real mouse drag through the overlapping hit regions.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380 });
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(Array.from({ length: 100 }, (_, i) => ({ time: 1704067200 + i * 86400, value: 30 + Math.sin(i / 5) * 10 })));
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const time = chart.timeScale().coordinateToTime(container.clientWidth / 2);
	const lines = ['first', 'second'].map(id => new LwcPlugin.VerticalLine(time, { draggable: true, width: 4, id }));
	lines.forEach(line => series.attachPrimitive(line));
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const before = JSON.stringify({ scroll: chart.options().handleScroll, scale: chart.options().handleScale });
	window.initialInteractionsToPerform = () => [{ action: 'horizontalDrag', target: 'container' }];
	window.afterInitialInteractions = () => {
		if (lines.filter(line => line.time() !== time).length !== 1) { throw new Error('A drag must move exactly one overlapping line'); }
		const after = JSON.stringify({ scroll: chart.options().handleScroll, scale: chart.options().handleScale });
		if (after !== before) { throw new Error('Overlapping lines did not restore chart controls'); }
	};
}
