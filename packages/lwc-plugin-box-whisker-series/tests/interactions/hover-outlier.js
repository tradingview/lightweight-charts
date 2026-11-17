// 6 px right of an outlier dot's center, 2 px outside its 4 px radius, the
// default tolerance of 3 reports it as 'outlier-<point>-<index>'; with a
// hitTestTolerance of 0 the same spot reports no part (the chart's own
// fallback may still report the series, without an objectId).
let chart;
let series;
let data;
let lastInfo;

const move = (x, y) => ({ action: 'moveMouseXY', target: 'pane', options: { x: Math.round(x), y: Math.round(y) } });
const xOf = index => chart.timeScale().timeToCoordinate(data[index].time);
const yOf = price => series.priceToCoordinate(price);

function expectPart(part, where) {
	const id = lastInfo && lastInfo.objectId;
	if (id !== part) {
		throw new Error(`${where}: expected ${JSON.stringify(part)}, got ${JSON.stringify(id)}`);
	}
}

async function setUp(container) {
	chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 40, rightOffset: 1 },
	});
	series = LwcPlugin.createBoxWhiskerSeries(chart);
	data = Array.from({ length: 8 }, (_, i) => ({
		time: 1704067200 + i * 86400,
		min: 10,
		q1: 30,
		median: 40,
		q3: 50,
		max: 70,
		outliers: [0, 90],
	}));
	series.setData(data);
	chart.subscribeCrosshairMove(param => {
		lastInfo = param.hoveredInfo;
	});
	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function beforeInteractions(container) {
	await setUp(container);
}

window.initialInteractionsToPerform = () => [move(xOf(4) + 6, yOf(90))];

window.afterInitialInteractions = () => {
	expectPart('outlier-4-1', 'beside the upper outlier, within the default tolerance');
	series.applyOptions({ hitTestTolerance: 0 });
};

window.finalInteractionsToPerform = () => [move(xOf(4) + 30, yOf(90)), move(xOf(4) + 6, yOf(90))];

window.afterFinalInteractions = () => expectPart(undefined, 'beside the outlier with a tolerance of 0');
