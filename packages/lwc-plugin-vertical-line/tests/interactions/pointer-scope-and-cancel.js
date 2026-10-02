async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);
	const data = Array.from({ length: 100 }, (_, i) => ({ time: 1704067200 + i * 86400, value: i }));
	chart.addSeries(LightweightCharts.LineSeries).setData(data);
	const series = chart.addSeries(LightweightCharts.LineSeries, {}, 1);
	series.setData(data);
	chart.timeScale().fitContent();
	const line = new LwcPlugin.VerticalLine(data[50].time, { draggable: true });
	series.attachPrimitive(line);
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const root = chart.chartElement();
	const bounds = root.getBoundingClientRect();
	const row = chart.panes()[1].getHTMLElement().getBoundingClientRect();
	const clientX = bounds.left + chart.priceScale('left').width() + line.coordinate();
	const ownY = (row.top + row.bottom) / 2;
	const snapshot = () => JSON.stringify({ scroll: chart.options().handleScroll, scale: chart.options().handleScale });
	const original = snapshot();
	const send = (type, overrides = {}) => root.dispatchEvent(new PointerEvent(type, {
		bubbles: true, isPrimary: true, pointerId: 1, button: 0, clientX, clientY: ownY, ...overrides,
	}));
	send('pointerdown', { clientY: bounds.top + 30 });
	if (snapshot() !== original) { throw new Error('Another pane started the drag'); }
	send('pointerdown', { button: 2 });
	if (snapshot() !== original) { throw new Error('A secondary button started the drag'); }
	send('pointerdown');
	if (snapshot() === original) { throw new Error('The primary pointer did not start a drag'); }
	send('pointerup', { pointerId: 2, isPrimary: false });
	if (snapshot() === original) { throw new Error('A different pointer ended the drag'); }
	send('pointercancel');
	if (snapshot() !== original) { throw new Error('Cancellation did not restore chart controls'); }
}
