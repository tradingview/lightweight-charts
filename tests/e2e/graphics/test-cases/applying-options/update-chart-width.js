function generateCandle(i, target) {
	const step = (i % 20) / 5000;
	const base = i / 5;
	target.open = base * (1 - step);
	target.high = base * (1 + 2 * step);
	target.low = base * (1 - 2 * step);
	target.close = base * (1 + step);
}

function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		const item = {
			time: time.getTime() / 1000,
		};
		time.setUTCDate(time.getUTCDate() + 1);

		generateCandle(i, item);
		res.push(item);
	}
	return res;
}

function runTestCase(container) {
	const box = container.getBoundingClientRect();
	const chart = window.chart = LightweightCharts.createChart(container, {
		width: 2000,
		height: box.height,
		timeScale: {
			barSpacing: 1000000,
			rightOffset: 100000,
		},
	});

	const mainSeries = chart.addCandlestickSeries();

	mainSeries.setData(generateData());

	return new Promise(resolve => {
		setTimeout(() => {
			chart.applyOptions({ width: box.width });
			resolve();
		}, 300);
	});
}
