function generateData(step) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	let value = step > 0 ? 0 : 500;
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: value,
		});

		value += step;

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const areaSeries = chart.addAreaSeries({
		crosshairMarkerBorderWidth: 5,
		crosshairMarkerBorderColor: 'yellow',
		crosshairMarkerBackgroundColor: 'red',
	});

	const lineSeries = chart.addLineSeries({
		crosshairMarkerBorderWidth: 1,
		crosshairMarkerBorderColor: 'blue',
		crosshairMarkerBackgroundColor: 'green',
	});

	areaSeries.setData(generateData(1));
	lineSeries.setData(generateData(-1));
}
