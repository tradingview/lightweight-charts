function generateCandle(i, target) {
	var step = (i % 20) / 5000;
	var base = i / 5;
	target.open = base * (1 - step);
	target.high = base * (1 + 2 * step);
	target.low = base * (1 - 2 * step);
	target.close = base * (1 + step);
}

function generateData() {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
		var item = {
			time: time.getTime() / 1000,
		};
		time.setUTCDate(time.getUTCDate() + 1);

		generateCandle(i, item);
		res.push(item);
	}
	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var box = container.getBoundingClientRect();
	var chart = LightweightCharts.createChart(container, {
		width: 2000,
		height: box.height,
		timeScale: {
			barSpacing: 1000000,
			rightOffset: 100000,
		},
	});

	var mainSeries = chart.addCandlestickSeries();

	mainSeries.setData(generateData());

	return new Promise((resolve) => {
		setTimeout(() => {
			chart.applyOptions({ width: box.width });
			resolve();
		}, 300);
	});
}
