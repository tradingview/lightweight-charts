// series.update() recolors only the bar it touched: a new bar is shaded as
// soon as it is appended, and updating the last bar in place re-asks the
// highlighter for it.
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
	series.setData(data);
	let calls = 0;
	let redLast = false;
	const highlighting = new LwcPlugin.SessionHighlighting(time => {
		calls++;
		return redLast && time === data[data.length - 1].time ? '#FF0000' : '';
	});
	series.attachPrimitive(highlighting);
	await frames();
	const callsAfterAttach = calls;
	if (callsAfterAttach !== 20) {
		throw new Error(`The highlighter was not asked exactly once per bar on attach: ${callsAfterAttach} calls`);
	}

	// Append a bar: only it should be colored, and only it should be asked for.
	const appended = { time: data[data.length - 1].time + 86400, open: 31, high: 33, low: 29, close: 32 };
	data.push(appended);
	redLast = true;
	series.update(appended);
	await frames();
	if (!redAt(chart, chart.timeScale().timeToCoordinate(appended.time))) {
		throw new Error('The appended bar was not shaded');
	}
	if (calls !== callsAfterAttach + 1) {
		throw new Error(`An incremental update re-asked the highlighter for every bar: ${calls - callsAfterAttach} calls`);
	}

	// Update the last bar in place: it is re-asked, and the answer changes.
	redLast = false;
	series.update({ ...appended, close: 30 });
	await frames();
	if (redAt(chart, chart.timeScale().timeToCoordinate(appended.time))) {
		throw new Error('Updating the last bar in place did not recolor it');
	}
	if (calls !== callsAfterAttach + 2) {
		throw new Error(`An in-place update re-asked the highlighter for every bar: ${calls - callsAfterAttach} calls`);
	}
}
