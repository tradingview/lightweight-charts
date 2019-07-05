function generateData() {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
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
	var chart = LightweightCharts.createChart(container, {
		layout: {
			backgroundColor: 'rgba(80, 80, 80, 0.5)',
		},
	});

	var series = chart.addLineSeries();

	series.setData(generateData());

	chart.timeScale().setVisibleRange({ from: 1545782400, to: 1559692800 });

	return new Promise((resolve) => {
		setTimeout(() => {
			chart.timeScale().setVisibleRange({ from: 1538352000, to: 1545782400 });
			resolve();
		}, 1000);
	});
}
