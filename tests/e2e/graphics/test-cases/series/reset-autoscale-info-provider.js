function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 50 + 30 * Math.sin((Math.PI * i) / 50),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		rightPriceScale: {
			scaleMargins: {
				bottom: 0,
				top: 0,
			},
		},
		layout: { attributionLogo: false },
	}));

	const mainSeries = chart.addSeries(LightweightCharts.LineSeries, {
		lineWidth: 1,
		color: '#ff0000',
		// custom provider forces a much wider range than the data,
		// so the series is visibly compressed into the middle of the pane
		autoscaleInfoProvider: () => ({
			priceRange: {
				minValue: -500,
				maxValue: 500,
			},
		}),
	});

	mainSeries.setData(generateData());

	return new Promise(resolve => {
		setTimeout(() => {
			// resetting the provider to undefined must restore the default
			// autoscale, so the series fills the pane again
			mainSeries.applyOptions({
				autoscaleInfoProvider: undefined,
			});

			resolve();
		}, 300);
	});
}
