function generateData(priceOffset) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		if (i % 100 === 99) {
			res.push({
				time: time.getTime() / 1000,
				value: i + priceOffset,
			});
		} else {
			res.push({
				time: time.getTime() / 1000,
			});
		}

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		timeScale: {
			rightOffset: 7,
			barSpacing: 50,
		},
	});

	const firstSeries = chart.addLineSeries({
		lineWidth: 1,
		color: '#ff0000',
		priceLineVisible: false,
		lastValueVisible: false,
		autoscaleInfoProvider: () => ({
			priceRange: {
				minValue: 0,
				maxValue: 1000,
			},
		}),
	});

	const secondSeries = chart.addAreaSeries({
		lineWidth: 1,
		color: '#ff0000',
		priceLineVisible: false,
		lastValueVisible: false,
		autoscaleInfoProvider: () => ({
			priceRange: {
				minValue: 0,
				maxValue: 1000,
			},
		}),
	});

	firstSeries.setData(generateData(0));
	secondSeries.setData(generateData(100));
}
