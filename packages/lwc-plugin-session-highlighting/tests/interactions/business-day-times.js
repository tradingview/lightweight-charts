// With date strings as data, an update that writes the same bar as a
// BusinessDay object replaces the bar's shading instead of adding a second
// column on top of it. The color is translucent so that a double paint shows
// up as a darker sample.
const frames = async () => { for (let i = 0; i < 4; i++) { await new Promise(requestAnimationFrame); } };

// The green channel of a screenshot sample 4px below the top edge at the
// bar's x. The page is white, so a single coat of rgba(255, 0, 0, 0.5) leaves
// it near 128, a second coat near 64, and no coat at 255.
function greenAt(chart, x) {
	const canvas = chart.takeScreenshot();
	const ratio = canvas.width / chart.chartElement().clientWidth;
	return canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(4 * ratio), 1, 1).data[1];
}

function dayOf(time) {
	return typeof time === 'string' ? Number(time.slice(-2)) : time.day;
}

function createChart(container) {
	return LightweightCharts.createChart(container, {
		height: 380,
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
		timeScale: { barSpacing: 20, rightOffset: 5 },
	});
}

async function beforeInteractions(container) {
	const chart = createChart(container);
	const series = chart.addSeries(LightweightCharts.CandlestickSeries);
	const data = Array.from({ length: 20 }, (_unused, i) => ({
		time: `2024-01-${String(i + 1).padStart(2, '0')}`,
		open: 30, high: 32, low: 28, close: 31,
	}));
	series.setData(data);
	let calls = 0;
	const highlighting = new LwcPlugin.SessionHighlighting(time => {
		calls++;
		return dayOf(time) === 20 || dayOf(time) === 11 ? 'rgba(255, 0, 0, 0.5)' : '';
	});
	series.attachPrimitive(highlighting);
	await frames();
	const greenOf = time => greenAt(chart, chart.timeScale().timeToCoordinate(time));
	const single = greenOf('2024-01-11');
	if (single < 100 || single > 160) {
		throw new Error(`A string-dated bar was not shaded once: green ${single}`);
	}
	if (greenOf('2024-01-12') < 240) {
		throw new Error('A bar the highlighter left empty was shaded');
	}
	const callsAfterAttach = calls;

	// Rewrite the last bar as a BusinessDay object: same bar, one coat.
	series.update({ time: { year: 2024, month: 1, day: 20 }, open: 30, high: 33, low: 28, close: 32 });
	await frames();
	const last = greenOf({ year: 2024, month: 1, day: 20 });
	if (last < 100) {
		throw new Error(`The last bar was shaded twice after being rewritten as a BusinessDay: green ${last}`);
	}
	if (last > 160) {
		throw new Error(`The last bar lost its shading after being rewritten as a BusinessDay: green ${last}`);
	}
	if (calls !== callsAfterAttach + 1) {
		throw new Error(`Rewriting the last bar asked the highlighter ${calls - callsAfterAttach} times`);
	}
}
