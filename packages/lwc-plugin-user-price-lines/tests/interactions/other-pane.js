// The button belongs to the series' pane: near the right edge of another pane
// a click adds nothing, while the same click in the series' pane does.
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
let lines;

async function beforeInteractions(container) {
	chart = makeChart(container);
	const series = addLineSeries(chart);
	addLineSeries(chart, 1);
	lines = new LwcPlugin.UserPriceLines();
	series.attachPrimitive(lines);
	await frames();
}

window.initialInteractionsToPerform = () => {
	// The container's x is the pane's, since there is no left price scale.
	const x = chart.timeScale().width() - 8;
	const y = chart.panes()[0].getHeight() + 1 + chart.panes()[1].getHeight() / 2;
	return [move(x, y, 'container'), click(x, y, 'container')];
};

window.afterInitialInteractions = async () => {
	expect(lines.lines().length === 0, 'A click in the other pane added a line');
	await outOfDoubleClick();
};

window.finalInteractionsToPerform = () => {
	const x = chart.timeScale().width() - 8;
	const y = chart.panes()[0].getHeight() / 2;
	return [move(x, y, 'container'), click(x, y, 'container')];
};

window.afterFinalInteractions = () => expect(lines.lines().length === 1, 'A click in the series pane did not add a line');
