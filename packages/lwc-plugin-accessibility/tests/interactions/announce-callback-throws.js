// A host onAnnounce callback that throws must not suppress the announcement.
async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380 });
	const series = chart.addSeries(LightweightCharts.LineSeries, {});
	series.setData([{ time: '2024-01-01', value: 10 }]);
	let calls = 0;
	LwcPlugin.addAccessibilityPlugin(chart, {
		dataUpdates: { mode: 'all', debounceMs: 1 },
		onAnnounce: () => { calls++; throw new Error('host callback failure'); },
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const region = container.querySelector('.lw-chart-a11y-shared-status-region');
	series.update({ time: '2024-01-01', value: 11 });
	const deadline = performance.now() + 3000;
	while (!region.textContent) {
		if (performance.now() > deadline) {
			throw new Error(`A throwing onAnnounce suppressed the live region (${calls} call(s))`);
		}
		await new Promise(requestAnimationFrame);
	}
	if (calls === 0) { throw new Error('onAnnounce was not called'); }
}
