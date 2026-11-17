// The button shows, and a click adds a line, where the price under the pointer
// is exactly 0: the original hid the button for a price of 0. The pane is 402
// px tall and the price scale spans -200 to 201 over it, a price unit per
// pixel row, so one row is at exactly 0. The time axis is hidden, which
// leaves the time scale 0 px wide: the button goes by the pane's width.
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const times = Array.from({ length: 60 }, (_, i) => 1704067200 + i * 86400);
const move = (x, y, target = 'pane') => ({ action: 'moveMouseXY', target, options: { x: Math.round(x), y: Math.round(y) } });
const click = (x, y, target = 'pane') => ({ action: 'clickXY', target, options: { x: Math.round(x), y: Math.round(y) } });

function makeChart(container, options = {}) {
	return LightweightCharts.createChart(container, { layout: { attributionLogo: false }, ...options });
}

function expect(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

let chart;
let series;
let lines;
let y;

async function beforeInteractions(container) {
	chart = makeChart(container, { width: 600, height: 402, timeScale: { visible: false }, rightPriceScale: { scaleMargins: { top: 0, bottom: 0 } } });
	series = chart.addSeries(LightweightCharts.LineSeries, {
		autoscaleInfoProvider: () => ({ priceRange: { minValue: -200, maxValue: 201 } }),
	});
	series.setData(times.map((time, i) => ({ time, value: i % 2 === 0 ? -10 : 10 })));
	lines = new LwcPlugin.UserPriceLines();
	series.attachPrimitive(lines);
	await frames();
	const height = chart.panes()[0].getHeight();
	y = Array.from({ length: height }, (_, row) => row).find(row => series.coordinateToPrice(row) === 0);
	expect(y !== undefined && y > 10, `No pixel row inside the ${height} px pane is at a price of exactly 0 (${y})`);
}

window.initialInteractionsToPerform = () => {
	const x = chart.paneSize(0).width - 8;
	return [move(x, y), click(x, y)];
};

window.afterInitialInteractions = () => {
	expect(lines.lines().length === 1, 'No line was added at a price of 0');
	expect(lines.lines()[0].options().price === 0, `The line is at ${lines.lines()[0].options().price}, not 0`);
};
