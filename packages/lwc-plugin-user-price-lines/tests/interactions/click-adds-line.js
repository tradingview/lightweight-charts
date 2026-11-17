// Hovering the right edge of the pane brings up the button at the pointer's
// height; clicking it adds a price line there with the line options, fires
// lineAdded once, and reports the button as the hovered object.
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
const added = [];
let y;

async function beforeInteractions(container) {
	chart = makeChart(container);
	series = addLineSeries(chart);
	lines = new LwcPlugin.UserPriceLines({ lineColor: '#F23645', lineWidth: 2, lineStyle: LightweightCharts.LineStyle.Dotted, axisLabelVisible: false });
	series.attachPrimitive(lines);
	lines.lineAdded().subscribe(line => added.push(line));
	chart.subscribeClick(param => {
		window.clickedObject = param.hoveredObjectId;
	});
	await frames();
	// The pointer lands on whole pixels.
	y = Math.round(series.priceToCoordinate(104.5));
}

window.initialInteractionsToPerform = () => {
	const x = chart.timeScale().width() - 8;
	return [move(x, y), click(x, y)];
};

window.afterInitialInteractions = () => {
	const priceLines = lines.lines();
	expect(priceLines.length === 1 && added.length === 1 && added[0] === priceLines[0], `Expected one line added and reported, got ${priceLines.length} and ${added.length}`);
	const options = priceLines[0].options();
	expect(Math.abs(options.price - series.coordinateToPrice(y)) < 1e-9, `Expected the line at ${series.coordinateToPrice(y)}, got ${options.price}`);
	expect(window.clickedObject === LwcPlugin.ADD_BUTTON_ID, `Expected the click to report the button, got ${JSON.stringify(window.clickedObject)}`);
	expect(options.color === '#F23645' && options.lineWidth === 2 && options.lineStyle === LightweightCharts.LineStyle.Dotted && options.axisLabelVisible === false, `The line options are not the plugin's: ${JSON.stringify(options)}`);
	expect(series.priceLines().length === 1, 'The line is not on the series');
};
