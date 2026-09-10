async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(Array.from({ length: 10000 }, (_, i) => ({ time: i + 1, value: 10 })));
	let announcements = 0;
	const controller = LwcPlugin.addAccessibilityPlugin(chart, {
		dataUpdates: { mode: 'none' },
		messages: { seriesUpdate: args => { announcements++; return LwcPlugin.defaultMessages.seriesUpdate(args); } },
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	let reads = 0;
	const data = series.data.bind(series);
	series.data = () => { reads++; return data(); };
	for (let i = 0; i < 100; i++) { series.update({ time: 10000, value: 20 + i }); }
	if (reads !== 0) { throw new Error(`Inactive updates caused ${reads} full data reads`); }
	controller.applyOptions({ dataUpdates: { mode: 'all', debounceMs: 20 } });
	const waitForAnnouncement = async previous => {
		const deadline = performance.now() + 3000;
		while (announcements === previous && performance.now() < deadline) { await new Promise(resolve => requestAnimationFrame(resolve)); }
		if (announcements === previous) { throw new Error('No announcement was delivered'); }
	};
	reads = 0;
	for (let i = 0; i < 100; i++) { series.update({ time: 10000, value: 120 + i }); }
	await waitForAnnouncement(0);
	if (reads !== 1) { throw new Error(`One announcement batch needed ${reads} full data reads`); }
	controller.focus();
	reads = 0;
	const before = announcements;
	series.update({ time: 10000, value: 300 });
	await waitForAnnouncement(before);
	if (reads !== 1) { throw new Error(`Focused navigation and announcement did not share their snapshot: ${reads}`); }
}
