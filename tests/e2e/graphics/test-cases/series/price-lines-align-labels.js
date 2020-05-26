function generateData() {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 60; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container, {
		priceScale: {
			mode: LightweightCharts.PriceScaleMode.Persentage,
			alignLabels: true,
		},
	});

	var series = chart.addLineSeries();
	series.setData(generateData());

	series.createPriceLine({ price: 58 });
	series.createPriceLine({ price: 59 });
	series.createPriceLine({ price: 60 });
	series.createPriceLine({ price: 61 });
	series.createPriceLine({ price: 62 });
}
