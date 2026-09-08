// Review finding 11: update(point, true) is also reported as scope 'update'.
async function runTestCase(container) {
	const t = window.PluginTest;
	const chart = t.chart(t.start(container, 'Keyboard navigation must read corrected historical values'));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = t.data(3, i => ({ value: (i + 1) * 10 }));
	series.setData(data);
	chart.timeScale().fitContent();
	let focused;
	const controller = LwcPlugin.addAccessibilityPlugin(chart, {
		dataScope: 'all', onFocusChange: event => { focused = event.value; },
	});
	await t.frames();
	controller.focus();
	const layer = container.querySelector('.lw-chart-a11y-layer');
	const home = () => layer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
	home();
	t.check('Initial keyboard value', focused === 10, focused, 10);
	series.update({ time: data[0].time, value: 99 }, true);
	home();
	t.check('Keyboard value after historical correction', focused === 99, focused, 99);
}
