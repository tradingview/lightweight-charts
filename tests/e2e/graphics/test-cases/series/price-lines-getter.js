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

	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());

	series.createPriceLine({ price: 10 });
	series.createPriceLine({ price: 20 });
	series.createPriceLine({ price: 30 });

	return new Promise(resolve => {
		setTimeout(() => {
			const priceLines = series.priceLines();
			const [line1, line2] = priceLines;

			// remove line 3 from array, however line3 should still be visible on the chart
			priceLines.splice(2, 1);

			// still check it can be removed
			series.removePriceLine(line1);

			// modify line 2 returned from the getter
			line2.applyOptions({
				price: 15,
				color: 'red',
			});
			resolve();
		}, 1000);
	});
}
