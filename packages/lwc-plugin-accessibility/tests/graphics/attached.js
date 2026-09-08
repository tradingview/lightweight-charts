function generateLineData(phase) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 80; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin((i + phase) / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// The plugin injects its DOM from `attached()` and retries over animation
// frames until the pane widget exists, so every case waits a few frames.
function waitFrames(count) {
	let promise = Promise.resolve();
	for (let i = 0; i < count; ++i) {
		promise = promise.then(() => new Promise(resolve => requestAnimationFrame(() => resolve())));
	}
	return promise;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));

	const price = chart.addSeries(LightweightCharts.LineSeries, { color: '#2962FF', title: 'Price' });
	price.setData(generateLineData(0));
	const average = chart.addSeries(LightweightCharts.LineSeries, { color: '#E91E63', title: 'Average' });
	average.setData(generateLineData(25));
	chart.timeScale().fitContent();

	window.a11y = LwcPlugin.addAccessibilityPlugin(chart, {
		chartTitle: 'Deterministic two-series chart',
	});

	return waitFrames(4);
}
