async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container);
	const series = LwcPlugin.createPrettyHistogramSeries(chart);
	series.setData([
		{ time: '2024-01-01' },
		{ time: '2024-01-02', value: 30, tag: 'kept' },
		{ time: '2024-01-03' },
	]);
	series.update({ time: '2024-01-04', value: 40, tag: 'removed' });
	series.pop(1);
	series.update({ time: { year: 2024, month: 1, day: 2 }, value: 30, tag: 'kept' }, true);
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	series.applyOptions({ base: 100 });
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	for (const value of [30, 100]) {
		const y = series.priceToCoordinate(value);
		if (y === null || y < 0 || y > chart.paneSize().height) {
			throw new Error(`Price ${value} is outside the pane after applyOptions: ${y}`);
		}
	}
	const first = chart.timeScale().timeToCoordinate('2024-01-01');
	const middle = chart.timeScale().timeToCoordinate('2024-01-02');
	const last = chart.timeScale().timeToCoordinate('2024-01-03');
	if (first === null || middle === null || last === null || !(first < middle && middle < last)) {
		throw new Error('Option changes lost whitespace times');
	}
	if (series.data().length !== 1) { throw new Error('Option changes resurrected popped data'); }
	if (series.data()[0].tag !== 'kept') { throw new Error('Option changes lost custom data fields'); }
	let changed = false;
	const onData = () => {
		if (!changed) {
			changed = true;
			series.applyOptions({ base: -100 });
		}
	};
	series.subscribeDataChanged(onData);
	series.update({ time: '2024-01-04', value: 45 });
	series.unsubscribeDataChanged(onData);
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	if (series.data().length !== 2) { throw new Error('Option change during a data event lost the new point'); }
	for (const value of [-100, 45]) {
		const y = series.priceToCoordinate(value);
		if (y === null || y < 0 || y > chart.paneSize().height) {
			throw new Error('Option change during a data event did not refresh autoscaling');
		}
	}

}

