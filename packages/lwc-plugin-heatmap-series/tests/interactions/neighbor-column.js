// The tolerance never reaches across slots: 1 px inside a column whose only
// cell is far below the pointer, next to a column with a cell at the pointer's
// height, no cell is reported. A cell of the next column would not be in the
// point `param.seriesData` holds for this slot. Right on the boundary between
// the two slots, the crosshair snaps to the left one, and so does the hit
// test.
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
		window.lastTime = param.time;
	});
	await frames();
}

// Even points have a cell from 0 to 10, odd ones from 20 to 30.
async function beforeInteractions(container) {
	await setUp(container, {}, i => [i % 2 === 0 ? { low: 0, high: 10, amount: 10 } : { low: 20, high: 30, amount: 90 }]);
}

// Point 4 holds 0 to 10; point 5, 40 px to the right, holds 20 to 30.
window.initialInteractionsToPerform = () => [move(xOf(4) + 19, yOf(25))];

window.afterInitialInteractions = () => expectCell(null, 'next to the neighboring column');

// Right on the boundary, 20 px right of point 4, half a bar spacing.
window.finalInteractionsToPerform = () => [move(xOf(4) + 20, yOf(25))];

window.afterFinalInteractions = () => {
	if (window.lastTime !== data[4].time) {
		throw new Error(`Expected the crosshair on point 4 at the boundary, got ${window.lastTime}`);
	}
	expectCell(null, 'on the boundary, in the slot of point 4');
};
