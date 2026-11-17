// The plugin-examples form, new UserPriceLines(chart, series, options),
// attaches itself, and its remove() detaches it, removing its lines. remove()
// after chart.remove() does not throw.
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
let series;
let lines;

async function beforeInteractions(container) {
	chart = makeChart(container);
	series = addLineSeries(chart);
	lines = new LwcPlugin.UserPriceLines(chart, series, { lineColor: '#FF00FF' });
	await frames();
}

window.initialInteractionsToPerform = () => {
	const x = chart.timeScale().width() - 8;
	return [move(x, 150), click(x, 150)];
};

window.afterInitialInteractions = async () => {
	expect(lines.lines().length === 1 && lines.lines()[0].options().color === '#FF00FF', 'The legacy form did not attach itself');
	lines.remove();
	expect(series.priceLines().length === 0, 'remove() left the plugin\'s line');
	window.clicks = 0;
	chart.subscribeClick(() => window.clicks++);
	await outOfDoubleClick();
};

window.finalInteractionsToPerform = () => {
	const x = chart.timeScale().width() - 8;
	return [move(x, 200), click(x, 200)];
};

window.afterFinalInteractions = () => {
	expect(window.clicks === 1, `Expected the chart to report the second click, got ${window.clicks}`);
	expect(series.priceLines().length === 0, 'remove() did not detach the plugin');
	const again = new LwcPlugin.UserPriceLines(chart, series);
	chart.remove();
	again.remove();
	again.remove();
};
