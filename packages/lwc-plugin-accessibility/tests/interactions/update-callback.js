async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380 });
	const series = [0, 1].map(index => chart.addSeries(LightweightCharts.LineSeries, {}, index));
	series.forEach(item => item.setData([{ time: '2024-01-01', value: 10 }]));
	let calls = [];
	const initialCalls = calls;
	const controller = LwcPlugin.addAccessibilityPlugin(chart, {
		dataUpdates: { mode: 'all', debounceMs: 1 }, onAnnounce: message => initialCalls.push(message),
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const region = container.querySelector('.lw-chart-a11y-shared-status-region');
	const waitForMessage = async () => {
		const deadline = performance.now() + 3000;
		while (!region.textContent) {
			if (performance.now() > deadline) { throw new Error('No background announcement'); }
			await new Promise(requestAnimationFrame);
		}
		if (calls.length !== 1 || calls[0] !== region.textContent) { throw new Error('The combined announcement was not mirrored exactly once'); }
	};
	series.forEach(item => item.update({ time: '2024-01-01', value: 11 }));
	await waitForMessage();
	const oldCalls = calls;
	calls = [];
	controller.applyOptions({ dataUpdates: { mode: 'active', debounceMs: 1 }, onAnnounce: message => calls.push(message) });
	controller.focus(1);
	region.textContent = '';
	series[1].update({ time: '2024-01-01', value: 12 });
	await waitForMessage();
	if (oldCalls.length !== 1) { throw new Error('The replaced callback was called again'); }
}
