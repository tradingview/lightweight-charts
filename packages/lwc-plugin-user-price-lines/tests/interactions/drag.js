// A drag that starts on the button adds nothing, as it is no click; a click on
// the button in the same place does add a line. The pane is 40 px wide, so its
// center is on the button.
const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const times = Array.from({ length: 60 }, (_, i) => 1704067200 + i * 86400);
// A second click in the same pane within 500 ms of the first is taken for a
// possible double click, and when the two are far apart neither event fires.
const outOfDoubleClick = () => new Promise(resolve => setTimeout(resolve, 600));

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

let lines;

async function beforeInteractions(container) {
	const chart = makeChart(container, { width: 40, height: 200, leftPriceScale: { visible: false }, rightPriceScale: { visible: false } });
	const series = addLineSeries(chart);
	lines = new LwcPlugin.UserPriceLines();
	series.attachPrimitive(lines);
	await frames();
}

window.initialInteractionsToPerform = () => [{ action: 'moveMouseCenter', target: 'pane' }, { action: 'verticalDrag', target: 'pane' }];

window.afterInitialInteractions = async () => {
	expect(lines.lines().length === 0, `A drag added ${lines.lines().length} lines`);
	await outOfDoubleClick();
};

window.finalInteractionsToPerform = () => [{ action: 'moveMouseCenter', target: 'pane' }, { action: 'click', target: 'pane' }];

window.afterFinalInteractions = () => expect(lines.lines().length === 1, `A click on the button added ${lines.lines().length} lines, not 1`);
