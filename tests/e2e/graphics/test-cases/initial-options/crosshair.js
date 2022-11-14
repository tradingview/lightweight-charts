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
				color: '#ff0000',
				width: 2,
				style: LightweightCharts.LineStyle.Solid,
			},
			horzLine: {
				color: '#00ff00',
				width: 3,
				labelVisible: false,
			},
		},
	});

	const mainSeries = chart.addAreaSeries();

	mainSeries.setData(generateData());
}
