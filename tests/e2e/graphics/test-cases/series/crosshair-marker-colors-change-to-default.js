function generateData(step) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	let value = step > 0 ? 0 : 500;
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: value,
		});

		value += step;

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const areaSeries = chart.addSeries(LightweightCharts.AreaSeries, {
		crosshairMarkerBorderColor: '#ff00ff',
		crosshairMarkerBackgroundColor: '#2296f3',
	});

	const lineSeries = chart.addSeries(LightweightCharts.LineSeries, {
		crosshairMarkerBorderColor: '#00ffff',
		crosshairMarkerBackgroundColor: '#2296f3',
	});

	areaSeries.setData(generateData(1));
	lineSeries.setData(generateData(-1));

	return new Promise(resolve => {
		setTimeout(() => {
			areaSeries.applyOptions({
				crosshairMarkerBorderColor: '',
				crosshairMarkerBackgroundColor: '',
			});

			lineSeries.applyOptions({
				crosshairMarkerBorderColor: '',
				crosshairMarkerBackgroundColor: '',
			});
			resolve();
		}, 300);
	});
}
