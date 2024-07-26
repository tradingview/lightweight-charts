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
	const chart = (window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } }));

	const mainSeries = chart.addLineSeries();

	mainSeries.setData(generateData());

	const priceLine = {
		price: 480,
		color: '#be1238',
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Dotted,
		axisLabelVisible: true,
		title: 'Test One',
		axisLabelTextColor: '#d04488',
		axisLabelColor: '#00DDDD',
	};
	const priceLine2 = {
		price: 470,
		color: '#333',
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Dotted,
		axisLabelVisible: true,
		title: 'Test Two',
		axisLabelColor: '#d04488',
	};
	const priceLine3 = {
		price: 450,
		color: '#333',
		lineWidth: 2,
		lineStyle: LightweightCharts.LineStyle.Dotted,
		axisLabelVisible: true,
		title: 'Test Three',
		axisLabelTextColor: '#00DDDD',
	};

	mainSeries.createPriceLine(priceLine);
	mainSeries.createPriceLine(priceLine2);
	mainSeries.createPriceLine(priceLine3);
}
