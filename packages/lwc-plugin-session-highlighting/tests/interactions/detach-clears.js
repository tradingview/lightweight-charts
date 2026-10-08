// Detaching removes the shading and unsubscribes from the series; attaching
// the same instance again restores it without throwing.
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
	const highlighting = new LwcPlugin.SessionHighlighting(() => { calls++; return '#FF0000'; });
	const x = chart.timeScale().timeToCoordinate(data[10].time);

	series.attachPrimitive(highlighting);
	await frames();
	if (!redAt(chart, x)) {
		throw new Error('The shading was not painted after the first attach');
	}

	series.detachPrimitive(highlighting);
	await frames();
	if (redAt(chart, x)) {
		throw new Error('The shading was still painted after detach');
	}
	const callsWhileDetached = calls;
	series.update({ time: data[data.length - 1].time + 86400, open: 31, high: 33, low: 29, close: 32 });
	await frames();
	if (calls !== callsWhileDetached) {
		throw new Error('A detached primitive still listened to data changes');
	}

	series.attachPrimitive(highlighting);
	await frames();
	if (!redAt(chart, x)) {
		throw new Error('The shading was not painted after the second attach');
	}
}
