async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);
	chart.addSeries(LightweightCharts.LineSeries, { visible: false })
		.setData([1, 2, 3, 4, 5].map(time => ({ time, value: 0 })));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData([1, 3, 5].map(time => ({ time, value: time })));
	let observed;
	LwcPlugin.addAccessibilityPlugin(chart, {
		dataScope: 'visible', dataUpdates: { mode: 'all', debounceMs: 1 },
		messages: { seriesUpdate: args => { observed = args; return LwcPlugin.defaultMessages.seriesUpdate(args); } },
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	for (const [from, to, expected] of [[2, 4, 2], [2.2, 4.2, 1], [2.2, 3.8, 0]]) {
		chart.timeScale().setVisibleLogicalRange({ from, to });
		await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		observed = undefined;
		series.update({ time: 5, value: 6 });
		const deadline = performance.now() + 3000;
		while (!observed && performance.now() < deadline) { await new Promise(resolve => requestAnimationFrame(resolve)); }
		if (observed?.count !== expected) {
			throw new Error(`Expected ${expected} sparse points in ${from}–${to}, got ${observed?.count}; actual range ${JSON.stringify(chart.timeScale().getVisibleLogicalRange())}`);
		}
	}
}
