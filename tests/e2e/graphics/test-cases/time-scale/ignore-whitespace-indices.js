function generateWhiteSpaceData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
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
		timeScale: {
			/**
			 * Expecting that only the grid lines for the three points are drawn.
			 */
			ignoreWhitespaceIndices: true,
		},
	}));

	const mainSeries = chart.addSeries(LightweightCharts.LineSeries);

	const data = generateWhiteSpaceData();
	data[0].value = 50;
	data[49].value = 70;
	data[99].value = 50;

	mainSeries.setData(data);
	chart.timeScale().fitContent();
}
