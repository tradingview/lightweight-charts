// Attaching the plugin to another series while it is attached moves it: it is
// detached from the first series, which removes its lines there, and the
// lines it adds next go to the second, where detaching removes them.
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

async function beforeInteractions(container) {
	const chart = makeChart(container);
	const first = addLineSeries(chart);
	const second = addLineSeries(chart, 1);
	const lines = new LwcPlugin.UserPriceLines();
	first.attachPrimitive(lines);
	lines.addLine(100);
	second.attachPrimitive(lines);
	expect(first.priceLines().length === 0, `Moving left ${first.priceLines().length} lines on the first series`);
	lines.addLine(105);
	expect(second.priceLines().length === 1 && lines.lines().length === 1, 'The line did not go to the second series');
	second.detachPrimitive(lines);
	expect(second.priceLines().length === 0, 'Detaching from the second series left its line');
	await frames();
}
