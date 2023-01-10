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
	const chart = window.chart = LightweightCharts.createChart(container, {
		leftPriceScale: {
			visible: true,
			borderColor: '#EFF2F5',
			ticksVisible: false,
		},
		rightPriceScale: {
			visible: true,
			borderColor: '#EFF2F5',
			ticksVisible: false,
		},
	});

	const series = chart.addLineSeries({
		priceScaleId: 'left',
	});
	series.setData(generateData());

	series.createPriceLine({
		price: 10,
		color: 'red',
		lineWidth: 1,
		lineStyle: LightweightCharts.LineStyle.Solid,
		title: 'price line',
	});

	const series2 = chart.addLineSeries({
		priceScaleId: 'right',
	});
	series2.setData(
		generateData().map(row => ({ time: row.time, value: row.value * 10 }))
	);

	chart.timeScale().fitContent();
}
