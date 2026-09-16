// Detaching a pane primitive after `chart.remove()` raises an asynchronous
// `Object is disposed` (fancy-canvas) error in the library – reproduced with a
// bare primitive too, so the fix belongs there. Until it lands the controller
// guards itself: `detach()` skips `pane.detachPrimitive` when the pane is gone,
// which is what this case checks (a page error fails it).

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

// The chart is gone by the time the screenshot is taken, so there is no
// crosshair to wait for.
window.ignoreMouseMove = true;

function runTestCase(container) {
	const chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	});

	const price = chart.addSeries(LightweightCharts.LineSeries, { color: '#2962FF', title: 'Price' });
	price.setData(generateLineData(0));
	chart.timeScale().fitContent();

	const controller = LwcPlugin.addAccessibilityPlugin(chart, { chartTitle: 'Removed chart' });

	// Hosts commonly tear the chart down first and only then dispose their
	// plugins; detach() must not throw on an already-removed chart.
	return waitFrames(4)
		.then(() => {
			chart.remove();
			controller.detach();
		})
		.then(() => waitFrames(2));
}
