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
			attributionLogo: false,
			background: {
				type: 'solid',
				color: 'rgba(50,100,150, 0.1)',
			},
			textColor: 'rgba(255,200,100)',
		},
	}));

	const mainSeries = chart.addSeries(LightweightCharts.AreaSeries, {
		priceFormat: {
			minMove: 1,
			precision: 0,
		},
		topColor: 'hsl(180, 50%, 45%)',
		bottomColor: 'hsla(160, 50%, 45%, 0%)',
		lineColor: 'hwb(160 10% 20%)',
	});

	mainSeries.setData(generateData());
}
