async function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, { height: 380 });
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData([{ time: '2024-01-01', value: 10 }, { time: '2024-01-11', value: 20 }]);
	const line = new LwcPlugin.VerticalLine('2024-01-02', { snap: 'nearest' });
	series.attachPrimitive(line);
	chart.timeScale().fitContent();
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const left = chart.timeScale().timeToCoordinate('2024-01-01');
	const right = chart.timeScale().timeToCoordinate('2024-01-11');
	for (const [time, expected] of [
		['2023-12-31', left], ['2024-01-01', left], ['2024-01-02', left],
		[{ year: 2024, month: 1, day: 2 }, left], [1704153600, left],
		['2024-01-10', right], ['2024-01-11', right], ['2024-01-12', right],
	]) {
		line.setTime(time);
		if (line.coordinate() !== expected) { throw new Error(`Wrong nearest bar for ${JSON.stringify(time)}`); }
	}
}
