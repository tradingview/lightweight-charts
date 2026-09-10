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

function injectedElements(container) {
	return Array.from(container.querySelectorAll('*')).filter(
		element => typeof element.className === 'string' && element.className.indexOf('lw-chart-a11y') === 0
	);
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));

	const price = chart.addSeries(LightweightCharts.LineSeries, { color: '#2962FF', title: 'Price' });
	price.setData(generateLineData(0));
	const volume = chart.addSeries(LightweightCharts.HistogramSeries, {}, 1);
	volume.setData(generateLineData(25));
	chart.timeScale().fitContent();

	const controller = LwcPlugin.addAccessibilityPlugin(chart, { chartTitle: 'Detached chart' });

	return waitFrames(4)
		.then(() => {
			if (injectedElements(container).length === 0) {
				throw new Error('the plugin did not inject its DOM before detach');
			}
			controller.detach();
		})
		.then(() => waitFrames(2))
		.then(() => {
			const left = injectedElements(container);
			if (left.length > 0) {
				throw new Error(`detach() left ${left.length} element(s): ${left.map(element => element.className).join(', ')}`);
			}
			// The chart must be untouched: the screenshot is a plain two-pane chart.
			if (container.querySelector('[aria-hidden="true"]') !== null) {
				throw new Error('detach() left an aria-hidden element behind');
			}
		});
}
