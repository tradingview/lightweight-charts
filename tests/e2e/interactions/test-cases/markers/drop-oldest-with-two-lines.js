const points = [];
const expected = new Set();
const hovered = new Set();

function initialInteractionsToPerform() {
	return [];
}

function finalInteractionsToPerform() {
	return points.flatMap(point => [{ action: 'moveMouseTopLeft' }, { action: 'clickXY', options: point }]);
}

async function beforeInteractions(container) {
	for (const shifts of [1, 5]) {
		const holder = document.createElement('div');
		container.appendChild(holder);
		const chart = LightweightCharts.createChart(holder, {
			width: 600,
			height: 280,
			layout: { attributionLogo: false },
		});
		const bars = chart.addSeries(LightweightCharts.CandlestickSeries);
		const high = chart.addSeries(LightweightCharts.LineSeries, { visible: false });
		const low = chart.addSeries(LightweightCharts.LineSeries, { visible: false });
		const start = 1700000100;
		let times = Array.from({ length: 100 }, (unused, i) => start + i * 60);
		const candles = data => data.map(time => ({ time, open: 100, high: 110, low: 90, close: 105 }));
		const values = (data, value) => data.map(time => ({ time, value }));
		const replace = () => {
			bars.setData(candles(times));
			high.setData(values(times, 115));
			low.setData(values(times, 85));
		};
		replace();
		const markerTime = times[90];
		const id = `shift-${shifts}`;
		expected.add(id);
		LightweightCharts.createSeriesMarkers(bars, [{ time: markerTime, position: 'inBar', shape: 'circle', color: 'red', size: 2, id }], { zOrder: 'top' });
		await new Promise(resolve => requestAnimationFrame(resolve));
		for (let step = 0; step < shifts; step++) {
			times = [...times.slice(1), times[times.length - 1] + 60];
			replace();
			await new Promise(resolve => requestAnimationFrame(resolve));
		}
		chart.timeScale().setVisibleLogicalRange({ from: 75, to: 99 });
		chart.subscribeClick(params => {
			if (params.hoveredObjectId === id) {
				hovered.add(id);
			}
		});
		await new Promise(resolve => requestAnimationFrame(resolve));
		points.push({ x: chart.timeScale().timeToCoordinate(markerTime) + 8, y: bars.priceToCoordinate(105) - 8 + holder.getBoundingClientRect().top });
	}
}

function afterInitialInteractions() {
	return Promise.resolve();
}

function afterFinalInteractions() {
	for (const id of expected) {
		if (!hovered.has(id)) {
			throw new Error(`Marker must stay hit-testable after dropping oldest bars with two line series: ${id}`);
		}
	}
	return Promise.resolve();
}
