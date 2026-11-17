// A column below the base is hovered between the base and its value. A value
// equal to the base draws nothing, so just above where its column would be,
// no column is reported: the neighboring columns are farther than the
// tolerance.
let chart;
let series;
let data;
let lastInfo;

// The group geometry as the series lays it out, read from its own options:
// every group is split into as many columns as the longest point has values.
function groupWidth() {
	return chart.timeScale().options().barSpacing * series.options().widthPercent / 100;
}

function columnCount() {
	return Math.max(...data.map(point => point.values.length));
}

function columnBox(index, column) {
	const x = chart.timeScale().timeToCoordinate(data[index].time);
	const width = groupWidth() / columnCount();
	const left = x - groupWidth() / 2 + width * column;
	const baseY = series.priceToCoordinate(series.options().base);
	const valueY = series.priceToCoordinate(data[index].values[column]);
	return { left, right: left + width, center: left + width / 2, top: Math.min(baseY, valueY), bottom: Math.max(baseY, valueY) };
}

// The objectId of a column of point 3, the point the tests hover, or no
// column for null.
function expectColumn(column, where) {
	const id = lastInfo && lastInfo.objectId;
	const expected = column === null ? undefined : `column-3-${column}`;
	if (id !== expected) {
		throw new Error(`${where}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(id)}`);
	}
}

async function setUp(container, values, options = {}) {
	chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 60, rightOffset: 1 },
	});
	series = LwcPlugin.createGroupedBarsSeries(chart, options);
	data = values.map((point, i) => ({ time: 1704067200 + i * 86400, values: point }));
	series.setData(data);
	chart.subscribeCrosshairMove(param => {
		lastInfo = param.hoveredInfo;
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

const move = (x, y) => ({ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(x), y: Math.round(y) } });

async function beforeInteractions(container) {
	await setUp(container, Array.from({ length: 6 }, () => [-20, 0, 30]), { base: 0 });
}

window.initialInteractionsToPerform = () => {
	const box = columnBox(3, 0);
	return [move(box.center, (box.top + box.bottom) / 2)];
};

window.afterInitialInteractions = () => expectColumn(0, 'inside the negative column');

window.finalInteractionsToPerform = () => {
	const box = columnBox(3, 1);
	return [move(box.center, box.top - 2)];
};

window.afterFinalInteractions = () => expectColumn(null, 'just above a value equal to the base');
