// Review finding 1: both extended endpoints start with NaN x coordinates.
async function runTestCase(container) {
	const t = window.PluginTest;
	const chart = t.chart(t.start(container, 'An interior viewport must retain the green area'));
	const series = chart.addCustomSeries(new LwcPlugin.StackedAreaSeries(), {
		lineVisible: false, priceLineVisible: false, lastValueVisible: false,
		colors: [{ line: '#00ff00', area: '#00ff00' }, { line: '#00ff00', area: '#00ff00' }],
	});
	series.setData(t.data(100, () => ({ values: [10, 20] })));
	// Deliberately before the first draw: no previously computed coordinates.
	chart.timeScale().setVisibleLogicalRange({ from: 10, to: 20 });
	await t.frames();
	const green = t.green(chart);
	t.check('Area covers a substantial part of the pane', green > 1000, green, '> 1000 green pixels');
}
