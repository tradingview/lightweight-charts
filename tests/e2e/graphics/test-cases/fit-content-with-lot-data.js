function generateData(valueOffset, count) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i + valueOffset,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		leftPriceScale: {
			visible: true,
			ticksVisible: false,
		},
		timeScale: {
			borderVisible: false,
			fixLeftEdge: true,
			fixRightEdge: true,
			timeVisible: true,
			lockVisibleTimeRangeOnResize: true,
		},
	});

	const series = chart.addLineSeries({
		color: 'green',
		lineWidth: 2,
		priceScaleId: 'left',
	});

	series.setData(generateData(0, 100000));

	chart.timeScale().fitContent();
}
