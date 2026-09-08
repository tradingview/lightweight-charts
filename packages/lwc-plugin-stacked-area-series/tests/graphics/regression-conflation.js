// Review finding 4: consecutive conflated bars have logical stride > 1.
async function runTestCase(container) {
	const t = window.PluginTest;
	const chart = t.chart(t.start(container, 'Conflation must preserve the filled area'), {
		timeScale: { enableConflation: true, minBarSpacing: 0.1, barSpacing: 0.1 },
	});
	const paneView = new LwcPlugin.StackedAreaSeries();
	// Observe the public custom-series lifecycle to verify the precondition.
	let factor = 1;
	const update = paneView.update.bind(paneView);
	paneView.update = (data, options) => {
		factor = data.conflationFactor ?? 1;
		update(data, options);
	};
	const series = chart.addCustomSeries(paneView, {
		priceLineVisible: false, lastValueVisible: false,
		lineVisible: false, colors: [{ line: '#00ff00', area: '#00ff00' }],
	});
	series.setData(t.data(8000, () => ({ values: [10, 20] })));
	chart.timeScale().fitContent();
	await t.frames(5);
	t.check('The chart actually conflated the data', factor > 1, factor, '> 1');
	const green = t.green(chart);
	t.check('Conflated area remains filled', green > 1000, green, '> 1000 green pixels');
}
