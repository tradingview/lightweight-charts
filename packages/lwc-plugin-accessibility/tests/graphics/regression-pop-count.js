// Review finding 10: changed last-time identity does not imply an append.
async function runTestCase(container) {
	const t = window.PluginTest;
	const chart = t.chart(t.start(container, 'Removing a point must report the true count'));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = t.data(3, i => ({ value: 10 + i }));
	series.setData(data);
	chart.timeScale().fitContent();
	let observed = null;
	const controller = LwcPlugin.addAccessibilityPlugin(chart, {
		dataScope: 'all', dataUpdates: { mode: 'all', debounceMs: 1 },
		messages: { seriesUpdate: args => { observed = args; return LwcPlugin.defaultMessages.seriesUpdate(args); } },
	});
	await t.frames();
	controller.focus();
	series.update({ ...data[2], value: 21 });
	await t.until(() => observed !== null);
	observed = null;
	series.pop();
	await t.until(() => observed !== null);
	const expected = series.data().length;
	t.check('Announced count equals the real series length', observed.count === expected, observed.count, expected);
}
