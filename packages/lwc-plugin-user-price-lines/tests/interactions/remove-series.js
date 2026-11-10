// chart.removeSeries does not detach a series' primitives. Once its series is
// gone the plugin stops listening: pointer moves throw nothing, crosshair
// subscribers added after it keep getting events, the crosshair mode is put
// back, and attached to a new series it adds one line per click, not two.
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const times = Array.from({ length: 60 }, (_, i) => 1704067200 + i * 86400);
const move = (x, y, target = 'pane') => ({ action: 'moveMouseXY', target, options: { x: Math.round(x), y: Math.round(y) } });
const click = (x, y, target = 'pane') => ({ action: 'clickXY', target, options: { x: Math.round(x), y: Math.round(y) } });

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
let laterMoves = 0;

async function beforeInteractions(container) {
	chart = makeChart(container, { crosshair: { mode: LightweightCharts.CrosshairMode.Magnet } });
	const first = addLineSeries(chart);
	lines = new LwcPlugin.UserPriceLines();
	first.attachPrimitive(lines);
	lines.addLine(100);
	chart.subscribeCrosshairMove(() => laterMoves++);
	chart.removeSeries(first);
	series = addLineSeries(chart);
	await frames();
}

window.initialInteractionsToPerform = () => [move(200, 150), move(chart.timeScale().width() - 8, 150)];

window.afterInitialInteractions = async () => {
	expect(laterMoves > 0, 'A crosshair subscriber added after the plugin stopped getting events');
	expect(chart.options().crosshair.mode === LightweightCharts.CrosshairMode.Magnet, 'The crosshair mode was not put back once the series was gone');
	expect(lines.lines().length === 0, 'The plugin still lists the lines of the removed series');
	series.attachPrimitive(lines);
	await frames();
};

window.finalInteractionsToPerform = () => {
	const x = chart.timeScale().width() - 8;
	return [move(x, 160), click(x, 160)];
};

window.afterFinalInteractions = () => expect(series.priceLines().length === 1, `Expected one line from one click, got ${series.priceLines().length}`);
