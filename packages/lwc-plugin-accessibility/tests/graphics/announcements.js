// What the plugin says, captured through `onAnnounce`: the marker on the
// focused point, the price lines in the summary, and the visible range on zoom.

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

	const data = generateLineData(0);
	const price = chart.addSeries(LightweightCharts.LineSeries, { color: '#2962FF', title: 'Price' });
	price.setData(data);
	price.createPriceLine({ price: 60, color: '#E1575A', title: 'Target' });
	const markers = [
		{ time: data[40].time, position: 'aboveBar', shape: 'circle', color: '#2962FF', text: 'Earnings' },
	];
	LightweightCharts.createSeriesMarkers(price, markers);
	chart.timeScale().fitContent();

	const spoken = [];
	const controller = (window.a11y = LwcPlugin.addAccessibilityPlugin(chart, {
		chartTitle: 'Announcing chart',
		dataScope: 'all',
		markers: () => markers,
		onAnnounce: message => spoken.push(message),
	}));

	return waitFrames(4)
		.then(() => {
			controller.focus(0);
			const layer = document.querySelector('.lw-chart-a11y-layer');
			const press = key => layer.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
			// Home, then Page Up four times, lands on point 41 – the marked one.
			press('Home');
			for (let i = 0; i < 4; ++i) {
				press('PageUp');
			}
			press('Enter');
			press('-');
		})
		.then(() => waitFrames(2))
		.then(() => {
			const all = spoken.join('\n');
			if (all.indexOf('Marker: Earnings.') < 0) {
				throw new Error(`the marker was not announced: ${all}`);
			}
			if (all.indexOf('Price line: Target at') < 0) {
				throw new Error(`the price line was not announced: ${all}`);
			}
			if (all.indexOf('Showing ') < 0) {
				throw new Error(`the visible range was not announced on zoom: ${all}`);
			}
		});
}
