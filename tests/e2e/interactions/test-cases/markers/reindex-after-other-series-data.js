const points = [];
const hovered = new Set();
const seen = [];

function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return points.flatMap(point => [{ action: 'moveMouseTopLeft' }, { action: 'clickXY', options: point }]);
}

async function beforeInteractions(container) {
	for (const numeric of [false, true]) {
		const holder = document.createElement('div');
		container.appendChild(holder);
		const chart = (numeric ? LightweightCharts.createOptionsChart : LightweightCharts.createChart)(holder, {
			width: 600,
			height: 280,
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
		const markerTime = start + 30 * 300;
		const id = numeric ? 'numeric' : 'time';
		LightweightCharts.createSeriesMarkers(bars, [{ time: markerTime, position: 'inBar', shape: 'circle', color: 'red', size: 2, id }], { zOrder: 'top' });
		await new Promise(resolve => requestAnimationFrame(resolve));
		const after = times(300, 100);
		bars.setData(candles(after));
		line.setData(values(after));
		volume.setData(volumes(after));
		chart.timeScale().setVisibleLogicalRange({ from: 20, to: 40 });
		chart.subscribeClick(params => {
			seen.push({ id, hit: params.hoveredObjectId, point: params.point });
			if (params.hoveredObjectId === id) {
				hovered.add(id);
			}
		});
		await new Promise(resolve => requestAnimationFrame(resolve));
		points.push({ x: chart.timeScale().timeToCoordinate(markerTime) + 8, y: bars.priceToCoordinate(105) - 8 + (numeric ? 280 : 0) });
	}
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	if (!hovered.has('time') || !hovered.has('numeric')) {
		throw new Error(`Markers must remain hit-testable after other series finish replacing the shared time scale: ${JSON.stringify({ seen, points })}`);
	}
	return Promise.resolve();
}
