// A crosshair placed with setCrosshairPosition, as charts kept in sync do,
// never brings the button up, and the chart reports no button under it:
// neither the placing nor the chart's own moves after it, on a data update,
// have a pointer event behind them.
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

// The pixel as seen: the pane's top canvas where it is painted, else its main
// canvas below.
function pixel(container, x, py) {
	const canvases = Array.from(container.querySelectorAll('tr:nth-of-type(1) td:nth-of-type(2) canvas')).reverse();
	for (const canvas of canvases) {
		const ratio = canvas.width / canvas.clientWidth;
		const data = Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(py * ratio), 1, 1).data);
		if (data[3] > 0) {
			return data;
		}
	}
	return [0, 0, 0, 0];
}

const isBlue = ([r, g, b]) => b > 200 && r < 60 && g < 60;

async function beforeInteractions(container) {
	const chart = makeChart(container, { crosshair: { horzLine: { labelBackgroundColor: '#0000FF' } }, timeScale: { rightOffset: 0 } });
	const series = addLineSeries(chart, 0, { lastValueVisible: false, priceLineVisible: false });
	// Blue whether the button would show hovered or not.
	series.attachPrimitive(new LwcPlugin.UserPriceLines({ hoverColor: '#0000FF' }));
	chart.timeScale().fitContent();
	let hovered;
	chart.subscribeCrosshairMove(param => {
		hovered = param.hoveredObjectId;
	});
	await frames();
	const last = times[times.length - 1];
	chart.setCrosshairPosition(104, last, series);
	series.update({ time: last, value: 101 });
	chart.timeScale().applyOptions({ barSpacing: chart.timeScale().options().barSpacing });
	await frames();
	const y = series.priceToCoordinate(104);
	const edge = pixel(container, chart.paneSize(0).width - 3, y);
	expect(!isBlue(edge), `The button showed for a crosshair placed by code: ${edge}`);
	expect(hovered !== LwcPlugin.ADD_BUTTON_ID, 'The chart reported the button under a crosshair placed by code');
}
