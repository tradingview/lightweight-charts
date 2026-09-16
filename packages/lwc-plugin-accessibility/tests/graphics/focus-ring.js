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

function pressKey(key) {
	const target = document.querySelector('.lw-chart-a11y-layer');
	if (!target) {
		throw new Error('the accessibility layer was not injected');
	}
	target.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));

	const price = chart.addSeries(LightweightCharts.LineSeries, { color: '#2962FF', title: 'Price' });
	price.setData(generateLineData(0));
	chart.timeScale().fitContent();

	const controller = (window.a11y = LwcPlugin.addAccessibilityPlugin(chart, {
		chartTitle: 'Focused chart',
	}));

	return waitFrames(4)
		.then(() => {
			controller.focus(0);
			// The ring only has a position once a point is active, which happens on
			// the first navigation key press (the first visible point). Page forward
			// so the ring sits mid-chart rather than clipped against the pane edge.
			pressKey('ArrowRight');
			for (let i = 0; i < 4; ++i) {
				pressKey('PageUp');
			}
		})
		.then(() => waitFrames(2));
}
