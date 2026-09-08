// Review finding 10: changed last-time identity does not imply an append.
async function runTestCase(container) {
	const t = window.PluginTest;
	const chart = t.chart(t.start(container, 'Replacing a business-day point must report the true count'));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = [{ time: { year: 2024, month: 1, day: 1 }, value: 10 }, { time: { year: 2024, month: 1, day: 2 }, value: 20 }];
	series.setData(data);
	chart.timeScale().fitContent();
	let observed = null;
	const controller = LwcPlugin.addAccessibilityPlugin(chart, {
		dataScope: 'all', dataUpdates: { mode: 'all', debounceMs: 1 },
		messages: { seriesUpdate: args => { observed = args; return LwcPlugin.defaultMessages.seriesUpdate(args); } },
	});
	await t.frames();
	controller.focus();
	series.update({ time: { year: 2024, month: 1, day: 2 }, value: 21 });
	await t.until(() => observed !== null);
	observed = null;
	series.update({ time: { year: 2024, month: 1, day: 2 }, value: 22 });
	await t.until(() => observed !== null);
	const expected = series.data().length;
	t.check('Announced count equals the real series length', observed.count === expected, observed.count, expected);
}
