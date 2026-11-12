// The pointer moving within the hovered cell keeps reporting the same cell and
// repaints nothing but the crosshair: the hit test returns no hit test data,
// so the chart sees the same hovered object and leaves the series as drawn.
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

let fills = 0;

async function beforeInteractions(container) {
	await setUp(container, {}, i => [{ low: 0, high: 30, amount: 10 + i * 10 }]);
	const context = container.querySelector('tr:nth-of-type(1) td:nth-of-type(2) canvas').getContext('2d');
	const fill = context.fill;
	context.fill = function (...args) {
		fills++;
		return fill.apply(this, args);
	};
}

window.initialInteractionsToPerform = () => [move(xOf(4), yOf(15))];

window.afterInitialInteractions = async () => {
	await frames();
	expectCell(0, 'in the cell');
	fills = 0;
};

window.finalInteractionsToPerform = () => [move(xOf(4) + 6, yOf(12)), move(xOf(4) - 8, yOf(20)), move(xOf(4) + 3, yOf(8)), move(xOf(4) - 2, yOf(25))];

// The runner waits a frame and more after this: an error thrown then fails the case as a page error.
window.afterFinalInteractions = async () => {
	await frames();
	expectCell(0, 'still in the cell');
	if (fills !== 0) {
		throw new Error(`Moves within the hovered cell repainted the series: ${fills} fills`);
	}
};
