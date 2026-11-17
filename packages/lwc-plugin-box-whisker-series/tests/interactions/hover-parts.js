// A pointer inside the box of the fifth point reports 'box-4'; on its upper
// whisker, between the box and the cap, it reports 'whisker-4'.
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

window.initialInteractionsToPerform = () => [move(xOf(4) + 2, yOf(45))];

window.afterInitialInteractions = () => expectPart('box-4', 'inside the box');

window.finalInteractionsToPerform = () => [move(xOf(4), yOf(60))];

window.afterFinalInteractions = () => expectPart('whisker-4', 'on the upper whisker');
