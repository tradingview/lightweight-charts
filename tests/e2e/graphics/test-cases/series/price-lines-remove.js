function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 60; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const series = chart.addLineSeries();
	series.setData(generateData());

	series.createPriceLine({ price: 10 });
	series.createPriceLine({ price: 20 });

	return new Promise(resolve => {
		setTimeout(() => {
			const [line1, line2] = series.priceLines();
			series.removePriceLine(line2);
			series.removePriceLine(line1);
			resolve();
		}, 1000);
	});
}
