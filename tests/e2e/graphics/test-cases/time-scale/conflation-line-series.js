function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 1000; ++i) {
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
		timeScale: {
			enableConflation: true,
			precomputeConflationOnInit: true,
			barSpacing: container.clientWidth / window.devicePixelRatio / 40000,
			minBarSpacing: container.clientWidth / 3 / 40000, // make all data visible
		},
		layout: { attributionLogo: false },
	});

	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		color: '#2196F3',
		lineWidth: 2,
	});

	// Generate 400k data points
	const data = generateData(40000);
	lineSeries.setData(data);

	// Fit all data in view
	chart.timeScale().fitContent();
}
