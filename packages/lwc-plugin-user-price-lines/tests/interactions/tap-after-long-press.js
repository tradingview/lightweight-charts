// After a long press near the right edge has brought the button up, a tap
// near the edge away from the button adds nothing. The pane is 40 px wide,
// so its center is on the button; the container's center, where the tap
// lands, is half the time axis height lower, off the 21 px button. (The chart
// also takes the crosshair away when that tap ends tracking mode, before it
// reports the click.)
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

// The long press lands on the button, which shows in the hover color.

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

let chart;
let series;
let lines;
let containerElement;

async function beforeInteractions(container) {
	containerElement = container;
	chart = makeChart(container, {
		width: 40,
		height: 200,
		leftPriceScale: { visible: false },
		rightPriceScale: { visible: false },
	});
	series = addLineSeries(chart);
	lines = new LwcPlugin.UserPriceLines({ hoverColor: '#0000FF' });
	series.attachPrimitive(lines);
	await frames();
}

window.initialInteractionsToPerform = () => [{ action: 'longTouch', target: 'pane' }];

window.afterInitialInteractions = async () => {
	await frames();
	const y = chart.panes()[0].getHeight() / 2;
	const shown = pixel(containerElement, chart.paneSize(0).width - 3, y);
	expect(isBlue(shown), `The long press did not bring the button up: ${shown}`);
};

window.finalInteractionsToPerform = () => [{ action: 'tap', target: 'container' }];

window.afterFinalInteractions = () => expect(lines.lines().length === 0, `A tap away from the button added ${lines.lines().length} lines`);
