// Regression test for https://github.com/tradingview/lightweight-charts/issues/2044.
//
// Replacing all series with shorter datasets compacts the time scale's logical
// indexes. `updateTimeScale` runs before `Series.setData` and, with fixed edges,
// synchronously recalculates the hovered crosshair — if a pane view still holds
// items cached against the old indexes, the bar colorer throws `Value is null`.
//
// The test hovers a data point, then compacts both series. It passes if no
// exception reaches the page.

const initialData = [
	{ time: '2025-01-01', value: 10 },
	{ time: '2025-01-02', value: 20 },
	{ time: '2025-01-03', value: 30 },
	{ time: '2025-01-04', value: 40 },
];

const compactedData = initialData.slice(1);

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
			fixLeftEdge: true,
			fixRightEdge: true,
		},
	});

	firstSeries = chart.addSeries(LightweightCharts.LineSeries);
	secondSeries = chart.addSeries(LightweightCharts.LineSeries);
	firstSeries.setData(initialData);
	secondSeries.setData(initialData);
	chart.timeScale().fitContent();

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			const x = chart.timeScale().timeToCoordinate(initialData[1].time);
			const y = firstSeries.priceToCoordinate(initialData[1].value);
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
	firstSeries.applyOptions({}); // forces a crosshair update that rebuilds the pane-view item cache with pre-compaction indexes. Required for reproducing the #2044 bug.
	secondSeries.setData(compactedData);

	return new Promise(resolve => requestAnimationFrame(resolve));
}

function afterFinalInteractions() {
	return Promise.resolve();
}
