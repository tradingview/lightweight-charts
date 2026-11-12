// With maxLines, adding a line past the limit removes the oldest, firing
// lineRemoved, by a click as by addLine; lowering the limit removes the oldest
// lines over it.
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
let first;
const removed = [];

async function beforeInteractions(container) {
	chart = makeChart(container);
	series = addLineSeries(chart);
	lines = new LwcPlugin.UserPriceLines({ maxLines: 3 });
	series.attachPrimitive(lines);
	lines.lineRemoved().subscribe(line => removed.push(line));
	first = lines.addLine(100);
	lines.addLine(102);
	lines.addLine(104);
	await frames();
}

window.initialInteractionsToPerform = () => {
	const x = chart.timeScale().width() - 8;
	return [move(x, 150), click(x, 150)];
};

window.afterInitialInteractions = () => {
	const prices = lines.lines().map(line => line.options().price);
	expect(prices.length === 3 && prices[0] === 102 && prices[1] === 104, `Expected the oldest line gone and three left, got ${prices}`);
	expect(removed.length === 1 && removed[0] === first, 'The oldest line was not reported removed');
	lines.applyOptions({ maxLines: 1 });
	expect(lines.lines().length === 1 && series.priceLines().length === 1 && removed.length === 3, `Lowering maxLines to 1 left ${lines.lines().length} lines`);
	lines.applyOptions({ maxLines: Infinity });
	lines.addLine(90);
	lines.addLine(91);
	expect(lines.lines().length === 3, 'With no limit, lines were removed');
};
