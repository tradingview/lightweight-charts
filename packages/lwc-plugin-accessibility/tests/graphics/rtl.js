// A right-to-left page: the shortcuts panel and the table are positioned with
// logical properties (inset-inline-start), so they sit on the leading – here the
// right – side instead of covering the price scale.

function generateLineData(phase) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 80; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin((i + phase) / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function waitFrames(count) {
	let promise = Promise.resolve();
	for (let i = 0; i < count; ++i) {
		promise = promise.then(() => new Promise(resolve => requestAnimationFrame(() => resolve())));
	}
	return promise;
}

function runTestCase(container) {
	container.dir = 'rtl';

	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));

	const price = chart.addSeries(LightweightCharts.LineSeries, { color: '#2962FF', title: 'Price' });
	price.setData(generateLineData(0));
	chart.timeScale().fitContent();

	const controller = (window.a11y = LwcPlugin.addAccessibilityPlugin(chart, {
		chartTitle: 'Right-to-left page',
		showShortcuts: true,
	}));

	return waitFrames(4)
		.then(() => {
			controller.focus(0);
			const layer = document.activeElement;
			// H opens the visible shortcuts panel.
			layer.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true }));
		})
		.then(() => waitFrames(2));
}
