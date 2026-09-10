function generateLineData(phase) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 80; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin((i + phase) / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function generateHistogramData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 80; ++i) {
		res.push({ time: time.getTime() / 1000, value: 100 + (i % 7) * 30 });
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
	const volume = chart.addSeries(LightweightCharts.HistogramSeries, {}, 1);
	volume.setData(generateHistogramData());
	chart.timeScale().fitContent();

	// One primitive per pane; focusing pane 1 outlines the lower pane and rings a
	// point of the histogram series there.
	const controller = (window.a11y = LwcPlugin.addAccessibilityPlugin(chart, {
		chartTitle: paneIndex => (paneIndex === 0 ? 'Price' : 'Volume'),
	}));

	return waitFrames(4)
		.then(() => {
			if (controller.plugins.length !== 2) {
				throw new Error(`expected one plugin per pane, got ${controller.plugins.length}`);
			}
			controller.focus(1);
			const layer = document.querySelectorAll('.lw-chart-a11y-layer')[1];
			const press = key => layer.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
			press('ArrowRight');
			for (let i = 0; i < 4; ++i) {
				press('PageUp');
			}
		})
		.then(() => waitFrames(2));
}
