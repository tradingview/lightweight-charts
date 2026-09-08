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
	const average = chart.addSeries(LightweightCharts.LineSeries, { color: '#E91E63', title: 'Average' });
	average.setData(generateLineData(25));
	chart.timeScale().fitContent();

	const controller = (window.a11y = LwcPlugin.addAccessibilityPlugin(chart, {
		chartTitle: 'Chart with visible shortcuts',
		showShortcuts: true,
	}));

	return waitFrames(4)
		.then(() => {
			controller.focus(0);
			// The plugin listens for keydown on its own focusable layer, which is
			// what focus() moved the focus to.
			const target = document.activeElement;
			if (!target || !target.classList.contains('lw-chart-a11y-layer')) {
				throw new Error('the accessibility layer did not receive focus');
			}
			// H toggles the visible shortcuts panel (and replaces the focus hint).
			target.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true }));
		})
		.then(() => waitFrames(2));
}
