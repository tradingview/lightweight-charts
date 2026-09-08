// A pane created after the controller was attached gets its own layer, without
// tearing down the panes that were already there: the focus stays where it was.

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
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));

	const price = chart.addSeries(LightweightCharts.LineSeries, { color: '#2962FF', title: 'Price' });
	price.setData(generateLineData(0));
	chart.timeScale().fitContent();

	const controller = (window.a11y = LwcPlugin.addAccessibilityPlugin(chart, {
		chartTitle: paneIndex => (paneIndex === 0 ? 'Price' : 'Volume'),
	}));

	return waitFrames(4)
		.then(() => {
			controller.focus(0);
			const layer = document.querySelector('.lw-chart-a11y-layer');
			const press = key => layer.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
			press('ArrowRight');
			for (let i = 0; i < 4; ++i) {
				press('PageUp');
			}
			// A second pane, created long after the controller was attached.
			const volume = chart.addSeries(LightweightCharts.HistogramSeries, {}, 1);
			volume.setData(generateLineData(25).map(point => ({ time: point.time, value: point.value * 2 })));
		})
		.then(() => waitFrames(6))
		.then(() => {
			if (controller.plugins.length !== 2) {
				throw new Error(`the new pane did not get a layer (${controller.plugins.length} plugin(s))`);
			}
			// The pane that was already focused keeps its focus and its focus ring.
			const layers = document.querySelectorAll('.lw-chart-a11y-layer');
			if (document.activeElement !== layers[0]) {
				throw new Error('attaching the new pane moved the focus');
			}
			const ring = document.querySelector('.lw-chart-a11y-focus-ring');
			if (!ring || ring.style.display === 'none') {
				throw new Error('the focus ring was lost when the pane was added');
			}
		});
}
