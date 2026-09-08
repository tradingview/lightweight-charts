// Review finding 2: no frame or second setData between options and ingestion.
async function runTestCase(container) {
	const t = window.PluginTest;
	const chart = t.chart(t.start(container, 'Nonzero-base columns must fit on their first draw'));
	const series = chart.addCustomSeries(new LwcPlugin.PrettyHistogramSeries(), {
		base: 100,
		priceLineVisible: false, lastValueVisible: false,
	});
	series.setData(t.data(12, i => ({ value: 30 + i })));
	chart.timeScale().fitContent();
	await t.frames();
	const values = [30, 41, 100];
	const coordinates = values.map(value => series.priceToCoordinate(value));
	const height = chart.paneSize().height;
	t.check('Baseline and all column endpoints fit in the pane',
		coordinates.every(y => y !== null && y >= 0 && y <= height),
		coordinates.map(y => y === null ? null : Math.round(y)), `0 through ${height}px`);
}
