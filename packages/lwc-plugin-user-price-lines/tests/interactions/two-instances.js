// Two instances on series in one pane: only the one attached last shows its
// button and adds a line for a click. Once it is detached, the other one does.
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const times = Array.from({ length: 60 }, (_, i) => 1704067200 + i * 86400);
const move = (x, y, target = 'pane') => ({ action: 'moveMouseXY', target, options: { x: Math.round(x), y: Math.round(y) } });
const click = (x, y, target = 'pane') => ({ action: 'clickXY', target, options: { x: Math.round(x), y: Math.round(y) } });
// A second click in the same pane within 500 ms of the first is taken for a
// possible double click, and when the two are far apart neither event fires.
const outOfDoubleClick = () => new Promise(resolve => setTimeout(resolve, 600));

function makeChart(container, options = {}) {
	return LightweightCharts.createChart(container, { layout: { attributionLogo: false }, ...options });
}

function addLineSeries(chart, paneIndex = 0, options = {}) {
	const series = chart.addSeries(LightweightCharts.LineSeries, options, paneIndex);
	series.setData(times.map((time, i) => ({ time, value: 100 + Math.sin(i / 5) * 10 })));
	return series;
}

function expect(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

let chart;
let first;
let second;
let other;

async function beforeInteractions(container) {
	chart = makeChart(container);
	const a = addLineSeries(chart);
	const b = addLineSeries(chart);
	first = new LwcPlugin.UserPriceLines();
	second = new LwcPlugin.UserPriceLines();
	a.attachPrimitive(first);
	b.attachPrimitive(second);
	// One in another pane stays active there.
	other = new LwcPlugin.UserPriceLines();
	addLineSeries(chart, 1).attachPrimitive(other);
	await frames();
}

window.initialInteractionsToPerform = () => {
	const x = chart.timeScale().width() - 8;
	return [move(x, 150), click(x, 150)];
};

window.afterInitialInteractions = async () => {
	expect(first.lines().length === 0 && second.lines().length === 1 && other.lines().length === 0, `Expected only the last attached instance to add, got ${first.lines().length} and ${second.lines().length}`);
	second.series.detachPrimitive(second);
	await outOfDoubleClick();
};

window.finalInteractionsToPerform = () => {
	const x = chart.timeScale().width() - 8;
	return [move(x, 160), click(x, 160)];
};

window.afterFinalInteractions = () => expect(first.lines().length === 1, `After the last one was detached, the first added ${first.lines().length} lines`);
