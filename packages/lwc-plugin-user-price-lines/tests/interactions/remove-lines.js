// removeLine removes a line the plugin added, fires lineRemoved with it and
// returns true; a line it did not add, or one already gone, is left alone and
// returns false. removeAll removes the rest. A line removed through the series
// is no longer listed.
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
	const removed = [];
	lines.lineRemoved().subscribe(line => removed.push(line));
	const [a, b, c, d] = [100, 102, 104, 106].map(price => lines.addLine(price));
	const foreign = series.createPriceLine({ price: 98 });
	expect(lines.removeLine(b) === true && removed.length === 1 && removed[0] === b, 'removeLine did not remove and report the line');
	expect(lines.removeLine(b) === false && lines.removeLine(foreign) === false, 'removeLine removed a line that is not the plugin\'s');
	series.removePriceLine(a);
	expect(lines.lines().length === 2 && lines.lines()[0] === c, `Expected the lines c and d listed, got ${lines.lines().length}`);
	lines.removeAll();
	expect(lines.lines().length === 0 && removed.length === 3 && removed.includes(d), `removeAll left ${lines.lines().length} lines and reported ${removed.length}`);
	expect(series.priceLines().length === 1 && series.priceLines()[0].options().price === 98, 'removeAll removed a line that is not the plugin\'s');
	await frames();
}
