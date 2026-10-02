// The runner performs a real mouse drag via Puppeteer.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380 });
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = Array.from({ length: 100 }, (_, i) => ({ time: 1704067200 + i * 86400, value: 30 + Math.sin(i / 5) * 10 }));
	series.setData(data);
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	// horizontalDrag starts at the centre of #container (300, 300).
	const time = chart.timeScale().coordinateToTime(container.clientWidth / 2);
	const line = new LwcPlugin.VerticalLine(time, { draggable: true, width: 4 });
	series.attachPrimitive(line);
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const before = JSON.stringify({ scroll: chart.options().handleScroll, scale: chart.options().handleScale });
	window.initialInteractionsToPerform = () => [{ action: 'horizontalDrag', target: 'container' }];
	window.afterInitialInteractions = () => {
		if (line.time() === time) { throw new Error('The drag did not move the line'); }
		const after = JSON.stringify({ scroll: chart.options().handleScroll, scale: chart.options().handleScale });
		if (after !== before) { throw new Error(`Scroll/scale settings were not restored: expected ${before}; got ${after}`); }
	};
}
