// series.pop() drops the shading of the popped bars without asking the
// highlighter, and the bars left keep theirs, painted once. A second series
// holds the same times so that the popped bar stays on the time scale: a
// stale entry for it would still be painted. The color is translucent so
// that a double paint shows up as a darker sample, and the columns are
// located by time at each step, because the chart may scroll when the last
// bar changes.
const frames = async () => { for (let i = 0; i < 4; i++) { await new Promise(requestAnimationFrame); } };

// The green channel of a screenshot sample 4px below the top edge at the
// bar's x. The page is white, so a single coat of rgba(255, 0, 0, 0.5) leaves
// it near 128, a second coat near 64, and no coat at 255. The first pane sits
// at the screenshot's origin because the left price scale is hidden.
function greenAt(chart, x) {
	const canvas = chart.takeScreenshot();
	const ratio = canvas.width / chart.chartElement().clientWidth;
	return canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(4 * ratio), 1, 1).data[1];
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
	const other = chart.addSeries(LightweightCharts.LineSeries);
	other.setData(data.map(bar => ({ time: bar.time, value: bar.close })));
	let calls = 0;
	const highlighting = new LwcPlugin.SessionHighlighting(time => {
		calls++;
		return time === data[19].time || time === data[17].time ? 'rgba(255, 0, 0, 0.5)' : '';
	});
	series.attachPrimitive(highlighting);
	await frames();
	const greenOf = time => greenAt(chart, chart.timeScale().timeToCoordinate(time));
	const expectOneCoat = (time, what) => {
		const green = greenOf(time);
		if (green < 100) {
			throw new Error(`${what} was painted more than once: green ${green}`);
		}
		if (green > 160) {
			throw new Error(`${what} was not painted: green ${green}`);
		}
	};
	const last = data[19].time;
	const kept = data[17].time;
	expectOneCoat(last, 'The last bar, after attach,');
	expectOneCoat(kept, 'The kept bar, after attach,');
	const callsAfterAttach = calls;

	// Pop the last two bars: their columns go, the bar before them keeps its
	// single coat, and the highlighter is not asked for anything.
	series.pop(2);
	await frames();
	expectOneCoat(kept, 'The kept bar, after pop,');
	if (greenOf(last) < 240) {
		throw new Error('The shading of a popped bar was still painted');
	}
	if (calls !== callsAfterAttach) {
		throw new Error(`pop() asked the highlighter ${calls - callsAfterAttach} times`);
	}

	// Append the last bar again: it is shaded once more, after one call.
	series.update(data[19]);
	await frames();
	expectOneCoat(last, 'The bar appended after a pop');
	expectOneCoat(kept, 'The kept bar, after the re-append,');
	if (calls !== callsAfterAttach + 1) {
		throw new Error(`Appending after a pop asked the highlighter ${calls - callsAfterAttach} times`);
	}
}
