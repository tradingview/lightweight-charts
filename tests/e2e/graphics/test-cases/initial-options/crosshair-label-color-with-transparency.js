function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		crosshair: {
			vertLine: {
				labelBackgroundColor: 'rgba(123, 123, 123, 0.5)',
			},
			horzLine: {
				labelBackgroundColor: 'rgba(120, 0, 19, 0.5)',
			},
		},
	});

	const mainSeries = chart.addAreaSeries();

	mainSeries.setData(generateData());
}
