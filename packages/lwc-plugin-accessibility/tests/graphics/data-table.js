// The "view as table" command (T): the active series rendered into a real
// <table> on demand – the WCAG text alternative for the chart.

function generateBarData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 40; ++i) {
		const open = 50 + Math.sin(i / 5) * 10;
		const close = open + (i % 3 === 0 ? 3 : -2);
		res.push({
			time: time.getTime() / 1000,
			open: open,
			high: Math.max(open, close) + 2,
			low: Math.min(open, close) - 2,
			close: close,
		});
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

// The table panel covers the middle of the pane, so a hover would never reach
// the chart and the crosshair wait would time out.
window.ignoreMouseMove = true;

function runTestCase(container) {
	const chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	});

	const price = chart.addSeries(LightweightCharts.CandlestickSeries, { title: 'Price' });
	price.setData(generateBarData());
	chart.timeScale().fitContent();

	const controller = LwcPlugin.addAccessibilityPlugin(chart, {
		chartTitle: 'Chart with a data table',
		// A short table so the panel stays inside the pane; the cap is announced.
		tableMaxRows: 10,
	});

	return waitFrames(4)
		.then(() => {
			controller.focus(0);
			const layer = document.querySelector('.lw-chart-a11y-layer');
			if (!layer) {
				throw new Error('the accessibility layer was not injected');
			}
			// OHLC columns, because the series carries a high / low band.
			layer.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true }));
		})
		.then(() => waitFrames(2))
		.then(() => {
			const table = document.querySelector('.lw-chart-a11y-data-table table');
			if (!table) {
				throw new Error('T did not open the data table');
			}
			if (table.querySelectorAll('tbody tr').length !== 10) {
				throw new Error('the table was not capped at tableMaxRows');
			}
		});
}
