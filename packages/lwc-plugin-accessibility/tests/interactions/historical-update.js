// Update(point, true) is also reported as scope 'update'.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380 });
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = Array.from({ length: 3 }, (_, i) => ({ time: 1704067200 + i * 86400, value: (i + 1) * 10 }));
	series.setData(data);
	chart.timeScale().fitContent();
	let focused;
	const controller = LwcPlugin.addAccessibilityPlugin(chart, {
		dataScope: 'all', onFocusChange: event => { focused = event.value; },
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	controller.focus();
	const layer = container.querySelector('.lw-chart-a11y-layer');
	const home = () => layer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
	home();
	if (focused !== 10) { throw new Error(`Expected initial keyboard value 10; got ${focused}`); }
	series.update({ time: data[0].time, value: 99 }, true);
	home();
	if (focused !== 99) { throw new Error(`Expected corrected keyboard value 99; got ${focused}`); }
}
