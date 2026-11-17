// A cell that is skipped, here one with a NaN amount, leaves a hole in its
// column. Over the hole no cell is reported, but the chart's own fallback,
// which covers a column from its lowest to its highest edge, still reports the
// series as hovered, without an objectId.
let chart;
let series;
let data;
let lastInfo;

const move = (x, y) => ({ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(x), y: Math.round(y) } });
const xOf = index => chart.timeScale().timeToCoordinate(data[index].time);
const yOf = price => series.priceToCoordinate(price);
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

function expectCell(cell, where) {
	const id = lastInfo && lastInfo.objectId;
	const expected = cell === null ? undefined : `cell-${cell}`;
	if (id !== expected) {
		throw new Error(`${where}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(id)}`);
	}
}

// Three cells per column, from 0 to 30, given top first, with no gap.
async function setUp(container, options = {}, cells = [{ low: 20, high: 30, amount: 90 }, { low: 10, high: 20, amount: 50 }, { low: 0, high: 10, amount: 10 }]) {
	chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 40, rightOffset: 1 },
	});
	series = LwcPlugin.createHeatmapSeries(chart, { cellGap: 0, ...options });
	data = Array.from({ length: 8 }, (_, i) => ({ time: 1704067200 + i * 86400, cells: typeof cells === 'function' ? cells(i) : cells }));
	series.setData(data);
	chart.subscribeCrosshairMove(param => {
		lastInfo = param.hoveredInfo;
	});
	await frames();
}

async function beforeInteractions(container) {
	await setUp(container, {}, [{ low: 20, high: 30, amount: 90 }, { low: 10, high: 20, amount: NaN }, { low: 0, high: 10, amount: 10 }]);
}

window.initialInteractionsToPerform = () => [move(xOf(4), yOf(15))];

window.afterInitialInteractions = () => {
	expectCell(null, 'over the hole');
	if (lastInfo === undefined || lastInfo.series !== series) {
		throw new Error('Expected the fallback to report the series over the hole');
	}
};
