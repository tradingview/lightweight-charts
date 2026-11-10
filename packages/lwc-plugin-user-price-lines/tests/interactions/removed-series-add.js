// Once its series is removed from the chart, addLine throws instead of adding
// a line to the removed series and reporting it.
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
	const series = addLineSeries(chart);
	const lines = new LwcPlugin.UserPriceLines();
	series.attachPrimitive(lines);
	let reported = 0;
	lines.lineAdded().subscribe(() => reported++);
	chart.removeSeries(series);
	let threw = false;
	try {
		lines.addLine(100);
	} catch {
		threw = true;
	}
	expect(threw && reported === 0, `addLine on a removed series threw: ${threw}, reported ${reported}`);
	await frames();
}
