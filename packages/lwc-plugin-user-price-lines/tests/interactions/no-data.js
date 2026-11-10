// Before the series has data it has no price, so no button shows and a click
// at the edge adds nothing; nothing throws.
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
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
let lines;

async function beforeInteractions(container) {
	chart = makeChart(container);
	const series = chart.addSeries(LightweightCharts.LineSeries);
	lines = new LwcPlugin.UserPriceLines();
	series.attachPrimitive(lines);
	await frames();
}

window.initialInteractionsToPerform = () => {
	const x = chart.timeScale().width() - 8;
	return [move(x, 150), click(x, 150)];
};

window.afterInitialInteractions = () => expect(lines.lines().length === 0, 'A line was added to a series with no data');
