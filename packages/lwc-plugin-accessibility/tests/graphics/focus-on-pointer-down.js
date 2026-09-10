// `focusOnPointerDown`: pressing the pane moves the keyboard focus into the
// semantic layer, so pointer and keyboard users share one focused chart. The
// screenshot shows the pane outline that a click produced.

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

	window.a11y = LwcPlugin.addAccessibilityPlugin(chart, {
		chartTitle: 'Chart focused by pointer',
		focusOnPointerDown: true,
	});

	return waitFrames(4)
		.then(() => {
			const layer = document.querySelector('.lw-chart-a11y-layer');
			if (!layer) {
				throw new Error('the accessibility layer was not injected');
			}
			// The layer is pointer-events: none, so the press lands on the canvas
			// below it and bubbles up to the pane wrapper the plugin listens on.
			const canvas = container.querySelector('canvas');
			canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
			if (document.activeElement !== layer) {
				throw new Error('pointerdown did not focus the accessibility layer');
			}
			const press = key => layer.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
			press('ArrowRight');
			for (let i = 0; i < 4; ++i) {
				press('PageUp');
			}
		})
		.then(() => waitFrames(2));
}
