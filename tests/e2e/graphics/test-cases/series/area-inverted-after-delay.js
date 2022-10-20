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
	const chart = window.chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addAreaSeries({
		invertFilledArea: false,
	});

	mainSeries.setData(generateData());

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			mainSeries.applyOptions({
				invertFilledArea: true,
			});
			requestAnimationFrame(resolve);
		});
	});
}
