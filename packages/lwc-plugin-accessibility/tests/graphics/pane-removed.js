// Removing a pane (by removing its last series) must not leave a stale layer
// behind: the controller drops that pane and the remaining pane still announces
// its data updates.

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
	const volume = chart.addSeries(LightweightCharts.HistogramSeries, {}, 1);
	volume.setData(generateLineData(25).map(point => ({ time: point.time, value: point.value * 2 })));
	chart.timeScale().fitContent();

	const controller = (window.a11y = LwcPlugin.addAccessibilityPlugin(chart, {
		chartTitle: paneIndex => (paneIndex === 0 ? 'Price' : 'Volume'),
	}));

	return waitFrames(4)
		.then(() => {
			if (controller.plugins.length !== 2) {
				throw new Error('expected one plugin per pane');
			}
			// Focus the pane that is about to disappear: in the default 'active'
			// update mode it would otherwise stay the announcing pane forever.
			controller.focus(1);
			// The library prunes a pane once its last series is removed.
			chart.removeSeries(volume);
		})
		.then(() => waitFrames(6))
		.then(() => {
			if (controller.plugins.length !== 1) {
				throw new Error(`the removed pane left ${controller.plugins.length} plugin(s) behind`);
			}
			if (document.querySelectorAll('.lw-chart-a11y-layer').length !== 1) {
				throw new Error('a layer was left behind by the removed pane');
			}
			// The surviving pane is still usable.
			controller.focus(0);
			const layer = document.querySelector('.lw-chart-a11y-layer');
			const press = key => layer.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
			press('ArrowRight');
			for (let i = 0; i < 4; ++i) {
				press('PageUp');
			}
		})
		.then(() => waitFrames(2));
}
