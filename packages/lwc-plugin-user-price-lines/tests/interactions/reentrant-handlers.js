// Handlers that call back into the plugin keep its rules: a lineRemoved
// handler that adds a line while maxLines trims still leaves at most maxLines,
// and one that tries to add a line while the plugin is detached gets an error
// and leaves no line behind.
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
	const lines = new LwcPlugin.UserPriceLines({ maxLines: 3 });
	series.attachPrimitive(lines);
	const [a] = [100, 101, 102].map(price => lines.addLine(price));
	let added = false;
	const addOnce = removed => {
		if (removed === a && !added) {
			added = true;
			lines.addLine(90);
		}
	};
	lines.lineRemoved().subscribe(addOnce);
	lines.addLine(103);
	expect(lines.lines().length === 3 && series.priceLines().length === 3, `Expected 3 lines after trimming with a handler adding one, got ${lines.lines().length} and ${series.priceLines().length}`);
	lines.lineRemoved().unsubscribe(addOnce);

	let threw = false;
	lines.lineRemoved().subscribe(() => {
		try {
			lines.addLine(80);
		} catch {
			threw = true;
		}
	});
	series.detachPrimitive(lines);
	expect(threw, 'Adding a line while detaching did not throw');
	expect(series.priceLines().length === 0, `Detaching left ${series.priceLines().length} lines`);
	await frames();
}
