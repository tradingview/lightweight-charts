// setHighlighter recolours every bar and asks the chart to redraw by itself.
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
	const highlighting = new LwcPlugin.SessionHighlighting(() => '');
	series.attachPrimitive(highlighting);
	await frames();
	const x = chart.timeScale().timeToCoordinate(data[10].time);
	if (redAt(chart, x)) {
		throw new Error('A highlighter returning an empty string painted a column');
	}

	highlighting.setHighlighter(time => (time === data[10].time ? '#FF0000' : ''));
	await frames();
	if (!redAt(chart, x)) {
		throw new Error('setHighlighter did not repaint the pane');
	}
	if (redAt(chart, chart.timeScale().timeToCoordinate(data[11].time))) {
		throw new Error('A bar the highlighter left empty was painted');
	}

	highlighting.applyOptions({ visible: false });
	await frames();
	if (redAt(chart, x)) {
		throw new Error('visible: false did not clear the shading');
	}
}
