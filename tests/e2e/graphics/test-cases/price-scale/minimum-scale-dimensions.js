function generateData(startAmount) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = startAmount; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

function runTestCase(container) {
	const chartOptions = {
		height: 500,
		width: 600,
		leftPriceScale: {
			visible: true,
			minimumWidth: 100,
		},
		rightPriceScale: {
			visible: true,
			minimumWidth: 150,
		},
		timeScale: {
			minimumHeight: 50,
		},
		layout: { attributionLogo: false },
	};

	const chart = (window.chart = LightweightCharts.createChart(
		container,
		chartOptions
	));

	const mainSeries = chart.addLineSeries({});
	mainSeries.setData(generateData(0));

	const mainSeries2 = chart.addLineSeries({
		color: '#000000',
		priceScaleId: 'left',
	});
	mainSeries2.setData(generateData(30));
}
