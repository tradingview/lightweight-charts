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
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: {
			attributionLogo: true,
			background: {
				type: 'solid',
				color: 'rgb(50,100,150)',
			},
			textColor: 'rgb(255,200,100)',
		},
	}));

	const mainSeries = chart.addLineSeries();

	mainSeries.setData(generateData());
}
