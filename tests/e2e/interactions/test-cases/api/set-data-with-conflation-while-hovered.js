// Regression test for https://github.com/tradingview/lightweight-charts/issues/2232.
//
// With `enableConflation`, a series caches conflated rows (copies which keep
// their logical indexes). Replacing the data of several series compacts those
// indexes, and the crosshair update made by the first `setData` rebuilds the
// pane view of the second series. It must not use the stale conflated rows.
//
// The test hovers the chart, then compacts both series. It passes if no
// exception reaches the page.

function generateData(count) {
	const start = Date.UTC(2020, 0, 1) / 1000;
	return Array.from({ length: count }, (_, i) => ({
		time: start + i * 86400,
		open: 10,
		high: 12,
		low: 8,
		close: 11,
	}));
}

const initialData = generateData(3000);
const compactedData = initialData.slice(1000);

let hoverPoint = null;
let firstSeries = null;
let secondSeries = null;

function initialInteractionsToPerform() {
	if (hoverPoint === null) {
		throw new Error('Expected hover coordinates to be available.');
	}

	return [{
		action: 'moveMouseXY',
		options: hoverPoint,
	}];
}

function finalInteractionsToPerform() {
	return [];
}

function beforeInteractions(container) {
	const chart = LightweightCharts.createChart(container, {
		timeScale: {
			enableConflation: true,
			fixLeftEdge: true,
			fixRightEdge: true,
		},
	});

	firstSeries = chart.addSeries(LightweightCharts.CandlestickSeries);
	secondSeries = chart.addSeries(LightweightCharts.CandlestickSeries);
	firstSeries.setData(initialData);
	secondSeries.setData(initialData);
	chart.timeScale().fitContent();

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			const x = chart.timeScale().timeToCoordinate(initialData[2800].time);
			const y = firstSeries.priceToCoordinate(initialData[2800].close);
			if (x === null || y === null) {
				throw new Error('Expected coordinates for the hovered data point.');
			}

			hoverPoint = { x: Math.round(x), y: Math.round(y) };
			resolve();
		});
	});
}

function afterInitialInteractions() {
	firstSeries.setData(compactedData);
	secondSeries.setData(compactedData);

	return new Promise(resolve => requestAnimationFrame(resolve));
}

function afterFinalInteractions() {
	return Promise.resolve();
}
