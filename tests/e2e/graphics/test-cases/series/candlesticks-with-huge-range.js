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
	var time = new Date(Date.UTC(2000, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 10000; ++i) {
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
	var chart = LightweightCharts.createChart(container);

	var mainSeries = chart.addCandlestickSeries();

	mainSeries.setData(generateData());

	chart.timeScale().setVisibleRange({
		from: (new Date(Date.UTC(2000, 0, 1, 0, 0, 0, 0))).getTime() / 1000,
		to: (new Date(Date.UTC(2019, 0, 2, 0, 0, 0, 0))).getTime() / 1000,
	});
}
