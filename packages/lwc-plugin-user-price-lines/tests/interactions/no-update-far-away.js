// The plugin asks the chart to repaint only when the button changes: pointer
// moves away from the edge, where no button shows, ask for nothing, and moves
// along the button ask once per move.
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const times = Array.from({ length: 60 }, (_, i) => 1704067200 + i * 86400);
const move = (x, y, target = 'pane') => ({ action: 'moveMouseXY', target, options: { x: Math.round(x), y: Math.round(y) } });

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
let updates = 0;

async function beforeInteractions(container) {
	chart = makeChart(container);
	const series = addLineSeries(chart);
	const lines = new LwcPlugin.UserPriceLines();
	const attached = lines.attached.bind(lines);
	lines.attached = param => attached({ ...param, requestUpdate: () => {
		updates++;
		param.requestUpdate();
	} });
	series.attachPrimitive(lines);
	await frames();
	updates = 0;
}

window.initialInteractionsToPerform = () => [move(100, 100), move(120, 140), move(160, 80), move(200, 120)];

window.afterInitialInteractions = () => {
	expect(updates === 0, `Pointer moves away from the edge asked for ${updates} repaints`);
};

window.finalInteractionsToPerform = () => {
	const x = chart.timeScale().width() - 8;
	return [move(x, 100), move(x, 120), move(x, 140)];
};

window.afterFinalInteractions = () => expect(updates === 3, `Moves along the button asked for ${updates} repaints, not 3`);
