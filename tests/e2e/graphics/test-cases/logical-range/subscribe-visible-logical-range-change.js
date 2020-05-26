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

	var series = chart.addLineSeries();

	var data = generateData(10);
	series.setData(data);

	return new Promise(resolve => {
		setTimeout(() => {
			var timeScale = chart.timeScale();

			var range = { from: 0, to: 5 };
			timeScale.setVisibleLogicalRange(range);

			timeScale.subscribeVisibleLogicalRangeChange(newRange => {
				console.assert(newRange !== null, 'newRange shouldn\'t be null');
				console.assert(newRange.from === range.from, `from index should be the same as previously set, expected=${range.to}, actual=${newRange.from}`);
				console.assert(newRange.to === range.to, `to index should be the same as previously set, expected=${range.to}, actual=${newRange.to}`);

				resolve();
			});
		}, 500);
	});
}
