function generateData(count) {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < count; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var mainSeries = chart.addLineSeries();
	var series = chart.addLineSeries();

	mainSeries.setData(generateData(61));

	// series has data with indexes/values [0..10, 30..60]
	series.setData(generateData(61).filter(item => item.value <= 10 || item.value >= 30));

	chart.timeScale().fitContent();

	var bars = series.barsInLogicalRange({ from: 15, to: 25 });
	console.assert(bars !== null, 'Bars shouldn\'t null');

	console.assert(bars.from === undefined, `from date should be undefined, actual=${bars.from}`);
	console.assert(bars.to === undefined, `to date should be undefined actual=${bars.to}`);
	console.assert(bars.barsBefore === 15, `barsBefore should be 15, actual=${bars.barsBefore}`);
	console.assert(bars.barsAfter === 35, `barsAfter should be 35, actual=${bars.barsAfter}`);
}
