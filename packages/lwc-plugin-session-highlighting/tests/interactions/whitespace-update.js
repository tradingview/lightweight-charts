// A whitespace item set with the data is not a bar: it gets no column and
// the highlighter is never asked about it. An update that turns a bar into
// whitespace removes its shading. For the last bar the highlighter is not
// asked; for a bar in the middle, reached by a historical update, every bar
// is recoloured so that the right one goes.
// The whitespace keeps the time on the scale, so a stale entry would still be
// painted. The columns are located by time at each step, because the chart
// scrolls when the last bar changes.
const frames = async () => { for (let i = 0; i < 4; i++) { await new Promise(requestAnimationFrame); } };

// Samples a screenshot of the chart 4px below the top edge at the bar's x and
// returns whether a red column is painted there. The first pane sits at the
// screenshot's origin because the left price scale is hidden, and the
// highlighters in these cases use opaque red so the sample is unambiguous.
function redAt(chart, x) {
	const canvas = chart.takeScreenshot();
	const ratio = canvas.width / chart.chartElement().clientWidth;
	const [r, g, b, a] = canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(4 * ratio), 1, 1).data;
	return a > 0 && r > 200 && g < 80 && b < 80;
}

function dailyBars(count, start = 1704067200) {
	return Array.from({ length: count }, (_unused, i) => ({ time: start + i * 86400, open: 30, high: 32, low: 28, close: 31 }));
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
	const data = dailyBars(20);
	const whitespace = data[5].time;
	series.setData(data.map(bar => (bar.time === whitespace ? { time: whitespace } : bar)));
	let calls = 0;
	const highlighting = new LwcPlugin.SessionHighlighting(time => {
		calls++;
		return time === data[19].time || time === data[17].time || time === whitespace ? '#FF0000' : '';
	});
	series.attachPrimitive(highlighting);
	await frames();
	const redAtTime = time => redAt(chart, chart.timeScale().timeToCoordinate(time));
	const last = data[19].time;
	const middle = data[17].time;
	if (!redAtTime(last) || !redAtTime(middle)) {
		throw new Error('The shading was not painted after attach');
	}
	if (redAtTime(whitespace)) {
		throw new Error('A whitespace item was shaded');
	}
	if (calls !== 19) {
		throw new Error(`The highlighter was asked ${calls} times on attach instead of once per bar, 19`);
	}
	let callsBefore = calls;

	// The last bar becomes whitespace: its column goes, without a call.
	series.update({ time: data[19].time });
	await frames();
	if (redAtTime(last)) {
		throw new Error('The shading of a bar turned into whitespace was still painted');
	}
	if (!redAtTime(middle)) {
		throw new Error('The shading of an untouched bar disappeared');
	}
	if (calls !== callsBefore) {
		throw new Error(`Turning the last bar into whitespace asked the highlighter ${calls - callsBefore} times`);
	}

	// The bar comes back with one call.
	series.update(data[19]);
	await frames();
	if (!redAtTime(last)) {
		throw new Error('A bar restored from whitespace was not shaded');
	}
	if (calls !== callsBefore + 1) {
		throw new Error(`Restoring the last bar asked the highlighter ${calls - callsBefore} times`);
	}
	callsBefore = calls;

	// A bar in the middle becomes whitespace: its column goes, the last bar
	// keeps its column, and every bar is recoloured.
	series.update({ time: data[17].time }, true);
	await frames();
	if (redAtTime(middle)) {
		throw new Error('The shading of a middle bar turned into whitespace was still painted');
	}
	if (!redAtTime(last)) {
		throw new Error('The last bar lost its shading when a middle bar became whitespace');
	}
	if (calls !== callsBefore + 18) {
		throw new Error(`Removing a middle bar asked the highlighter ${calls - callsBefore} times instead of 18`);
	}
}
