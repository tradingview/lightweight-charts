// Review finding 3. The runner performs a real mouse drag via Puppeteer.
async function runTestCase(container) {
	const t = window.PluginTest;
	const chart = t.chart(t.start(container, 'Dragging a line must restore chart controls'));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = t.data(100, i => ({ value: 30 + Math.sin(i / 5) * 10 }));
	series.setData(data);
	chart.timeScale().fitContent();
	await t.frames();
	// horizontalDrag starts at the centre of #container (300, 300).
	const time = chart.timeScale().coordinateToTime(container.clientWidth / 2);
	const line = new LwcPlugin.VerticalLine(time, { draggable: true, width: 4 });
	series.attachPrimitive(line);
	await t.frames();
	const before = JSON.stringify({ scroll: chart.options().handleScroll, scale: chart.options().handleScale });
	window.initialInteractionsToPerform = () => [{ action: 'horizontalDrag', target: 'container' }];
	window.afterInitialInteractions = () => {
		t.check('The gesture moved the line', line.time() !== time, line.time(), 'a different time');
		const after = JSON.stringify({ scroll: chart.options().handleScroll, scale: chart.options().handleScale });
		t.check('Scroll and scale settings are restored', after === before,
			after === before ? 'restored' : 'controls remain disabled', 'original settings');
	};
}
