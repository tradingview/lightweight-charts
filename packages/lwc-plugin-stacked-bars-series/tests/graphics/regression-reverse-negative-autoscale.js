// Review finding 9: [10, -20] in reverse visits -20 before ending at -10.
async function runTestCase(container) {
	const t = window.PluginTest;
	const chart = t.chart(t.start(container, 'Reverse mixed-sign columns must remain in view'));
	const series = chart.addCustomSeries(new LwcPlugin.StackedBarsSeries(), {
		stackOrder: 'reverse', priceLineVisible: false, lastValueVisible: false,
	});
	series.setData(t.data(12, () => ({ values: [10, -20] })));
	chart.timeScale().fitContent();
	await t.frames();
	const y = series.priceToCoordinate(-20);
	const height = chart.paneSize().height;
	t.check('The lowest rendered endpoint is visible', y !== null && y >= 0 && y <= height, Math.round(y), `0 through ${height}px`);
}
