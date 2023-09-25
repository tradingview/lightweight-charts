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
	const chart = (window.chart = LightweightCharts.createChart(container));

	const mainSeries = chart.addLineSeries();

	mainSeries.setData(generateData());

	// Testing if CSS color names are getting correctly parsed
	// and if generateContrastColors if working correctly.
	const priceLine = {
		price: 480,
		color: 'aliceblue',
		lineStyle: LightweightCharts.LineStyle.Solid,
	};
	const priceLine2 = {
		price: 470,
		color: 'coral',
		lineStyle: LightweightCharts.LineStyle.Solid,
	};
	const priceLine3 = {
		price: 450,
		color: 'darkmagenta',
		lineStyle: LightweightCharts.LineStyle.Solid,
	};
	const priceLine4 = {
		price: 440,
		color: 'linen',
		lineStyle: LightweightCharts.LineStyle.Solid,
	};
	const priceLine5 = {
		price: 430,
		color: 'whitesmoke',
		lineStyle: LightweightCharts.LineStyle.Solid,
	};
	const priceLine6 = {
		price: 420,
		color: 'white',
		lineStyle: LightweightCharts.LineStyle.Solid,
	};
	const priceLine7 = {
		price: 410,
		color: 'transparent',
		lineStyle: LightweightCharts.LineStyle.Solid,
	};

	mainSeries.createPriceLine(priceLine);
	mainSeries.createPriceLine(priceLine2);
	mainSeries.createPriceLine(priceLine3);
	mainSeries.createPriceLine(priceLine4);
	mainSeries.createPriceLine(priceLine5);
	mainSeries.createPriceLine(priceLine6);
	mainSeries.createPriceLine(priceLine7);
}
