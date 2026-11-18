async function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	});
	const bars = chart.addSeries(LightweightCharts.CandlestickSeries);
	const line = chart.addSeries(LightweightCharts.LineSeries);
	const volume = chart.addSeries(LightweightCharts.HistogramSeries, { priceScaleId: '' });
	volume.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
	const start = 1700000100;
	const times = (step, count) => Array.from({ length: count }, (unused, i) => start + i * step);
	const candles = data => data.map(time => ({ time, open: 100, high: 110, low: 90, close: 105 }));
	const values = data => data.map(time => ({ time, value: 105 }));
	const volumes = data => data.map(time => ({ time, value: 1 }));
	const before = times(60, 400);
	bars.setData(candles(before));
	line.setData(values(before));
	volume.setData(volumes(before));
	LightweightCharts.createSeriesMarkers(bars, [
		{ time: start + 30 * 300, position: 'aboveBar', shape: 'arrowDown', color: 'red', text: 'ABOVE' },
		{ time: start + 32 * 300, position: 'belowBar', shape: 'arrowUp', color: 'blue', text: 'BELOW' },
	]);
	await new Promise(resolve => requestAnimationFrame(resolve));
	const after = times(300, 100);
	bars.setData(candles(after));
	line.setData(values(after));
	volume.setData(volumes(after));
	chart.timeScale().setVisibleLogicalRange({ from: 20, to: 40 });
	await new Promise(resolve => requestAnimationFrame(resolve));
}
