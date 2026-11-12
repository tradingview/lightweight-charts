// Near the pane edge, but not on the button, the button is painted at the
// edge in the crosshair label color; on it, in the hover color.
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const times = Array.from({ length: 60 }, (_, i) => 1704067200 + i * 86400);
const move = (x, y, target = 'pane') => ({ action: 'moveMouseXY', target, options: { x: Math.round(x), y: Math.round(y) } });

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

let chart;
let series;
let y;
let containerElement;

// The pixel as seen: the pane's top canvas where it is painted, else its main
// canvas below.
function pixel(x, py) {
	const canvases = Array.from(containerElement.querySelectorAll('tr:nth-of-type(1) td:nth-of-type(2) canvas')).reverse();
	for (const canvas of canvases) {
		const ratio = canvas.width / canvas.clientWidth;
		const data = Array.from(canvas.getContext('2d').getImageData(Math.round(x * ratio), Math.round(py * ratio), 1, 1).data);
		if (data[3] > 0) {
			return data;
		}
	}
	return [0, 0, 0, 0];
}

async function beforeInteractions(container) {
	containerElement = container;
	chart = makeChart(container, { crosshair: { horzLine: { labelBackgroundColor: '#0000FF' } } });
	series = addLineSeries(chart, 0, { lastValueVisible: false, priceLineVisible: false });
	series.attachPrimitive(new LwcPlugin.UserPriceLines({ hoverColor: '#FF0000' }));
	await frames();
	y = series.priceToCoordinate(104);
}

// Near the edge but not on the button: 30 px in, the button is 22 px wide.
window.initialInteractionsToPerform = () => [move(chart.timeScale().width() - 30, y)];

window.afterInitialInteractions = async () => {
	await frames();
	const edge = pixel(chart.timeScale().width() - 3, y);
	expect(edge[2] > 200 && edge[0] < 60, `Expected the button in the crosshair label color, got ${edge}`);
};

window.finalInteractionsToPerform = () => [move(chart.timeScale().width() - 8, y)];

window.afterFinalInteractions = async () => {
	await frames();
	const edge = pixel(chart.timeScale().width() - 3, y);
	expect(edge[0] > 200 && edge[2] < 60, `Expected the button in the hover color, got ${edge}`);
};
