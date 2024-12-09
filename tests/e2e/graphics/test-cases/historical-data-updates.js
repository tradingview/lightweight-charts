function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 50; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: {
			attributionLogo: true,
		},
	}));

	const mainSeries = chart.addSeries(LightweightCharts.LineSeries);

	const data = generateData();
	const thirdLastPoint = {
		...data[data.length - 4],
	};
	mainSeries.setData(data);

	try {
		mainSeries.update(thirdLastPoint);

		console.assert(
			false,
			'should fail if older update and not setting historicalUpdate to true'
		);
	} catch (e) {
		// passed
	}
	try {
		mainSeries.update(
			{ ...thirdLastPoint, value: thirdLastPoint.value - 10 },
			true
		);
	} catch (e) {
		// would fail on older version of library,
		// but graphics difference should be visible
	}
	chart.timeScale().fitContent();
}
