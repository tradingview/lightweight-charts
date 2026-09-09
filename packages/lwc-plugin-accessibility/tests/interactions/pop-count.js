// Changed last-time identity does not imply an append.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380 });
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = Array.from({ length: 3 }, (_, i) => ({ time: 1704067200 + i * 86400, value: 10 + i }));
	series.setData(data);
	chart.timeScale().fitContent();
	let observed = null;
	const controller = LwcPlugin.addAccessibilityPlugin(chart, {
		dataScope: 'all', dataUpdates: { mode: 'all', debounceMs: 1 },
		messages: { seriesUpdate: args => { observed = args; return LwcPlugin.defaultMessages.seriesUpdate(args); } },
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	controller.focus();
	series.update({ ...data[2], value: 21 });
	await waitForUpdate(() => observed);
	observed = null;
	series.pop();
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
