// Attaching sets the crosshair to Normal mode; detaching removes the lines
// the plugin added, firing lineRemoved for each, puts the crosshair mode back,
// and a click on the edge then adds nothing. A detached plugin cannot add.
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
const removed = [];

async function beforeInteractions(container) {
	chart = makeChart(container, { crosshair: { mode: LightweightCharts.CrosshairMode.Magnet } });
	series = addLineSeries(chart);
	lines = new LwcPlugin.UserPriceLines();
	series.attachPrimitive(lines);
	expect(chart.options().crosshair.mode === LightweightCharts.CrosshairMode.Normal, 'Attaching did not set the crosshair to Normal mode');
	lines.lineRemoved().subscribe(line => removed.push(line));
	lines.addLine(105);
	lines.addLine(95);
	series.createPriceLine({ price: 100 });
	series.detachPrimitive(lines);
	expect(removed.length === 2, `Detaching reported ${removed.length} removed lines, not 2`);
	expect(series.priceLines().length === 1, `Detaching left ${series.priceLines().length} lines, not just the one it did not add`);
	expect(chart.options().crosshair.mode === LightweightCharts.CrosshairMode.Magnet, 'Detaching did not put the crosshair mode back');
	let threw = false;
	try {
		lines.addLine(140);
	} catch {
		threw = true;
	}
	expect(threw && series.priceLines().length === 1, 'A detached plugin added a price line');
	await frames();
}

window.initialInteractionsToPerform = () => {
	const x = chart.timeScale().width() - 8;
	return [move(x, 150), click(x, 150)];
};

window.afterInitialInteractions = () => expect(series.priceLines().length === 1, 'A click added a line after detaching');
