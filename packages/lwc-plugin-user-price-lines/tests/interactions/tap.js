// A tap moves no crosshair, so the button is never shown, and a tap where it
// would be adds nothing. The pane is 40 px wide, so its center, where the tap
// lands, is within the button's reach of the right edge.
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const times = Array.from({ length: 60 }, (_, i) => 1704067200 + i * 86400);

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

let lines;

async function beforeInteractions(container) {
	const chart = makeChart(container, { width: 40, height: 200, leftPriceScale: { visible: false }, rightPriceScale: { visible: false } });
	const series = addLineSeries(chart);
	lines = new LwcPlugin.UserPriceLines();
	series.attachPrimitive(lines);
	await frames();
}

window.initialInteractionsToPerform = () => [{ action: 'tap', target: 'pane' }];

window.afterInitialInteractions = () => expect(lines.lines().length === 0, 'A tap added a line without the button being shown');
