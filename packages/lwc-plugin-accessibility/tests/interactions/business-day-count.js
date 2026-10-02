// Changed last-time identity does not imply an append.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380 });
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = [{ time: { year: 2024, month: 1, day: 1 }, value: 10 }, { time: { year: 2024, month: 1, day: 2 }, value: 20 }];
	series.setData(data);
	chart.timeScale().fitContent();
	let observed = null;
	const controller = LwcPlugin.addAccessibilityPlugin(chart, {
		dataScope: 'all', dataUpdates: { mode: 'all', debounceMs: 1 },
		messages: { seriesUpdate: args => { observed = args; return LwcPlugin.defaultMessages.seriesUpdate(args); } },
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	controller.focus();
	series.update({ time: { year: 2024, month: 1, day: 2 }, value: 21 });
	await waitForUpdate(() => observed);
	observed = null;
	series.update({ time: { year: 2024, month: 1, day: 2 }, value: 22 });
	await waitForUpdate(() => observed);
	const expected = series.data().length;
	if (observed.count !== expected) { throw new Error(`Expected ${expected} points; announced ${observed.count}`); }
}

async function waitForUpdate(readUpdate) {
	const deadline = performance.now() + 3000;
	while (readUpdate() === null) {
		if (performance.now() > deadline) {
			throw new Error('No accessibility update was announced');
		}
		await new Promise(resolve => requestAnimationFrame(resolve));
	}
}
