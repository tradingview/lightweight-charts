function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 30; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function generateColoredData() {
	const data = generateData();
	data.forEach((item, index) => {
		item.color = index % 2 === 0 ? 'rgba(0, 150, 136, 0.8)' : 'rgba(255,82,82, 0.8)';
	});

	return data;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const areaSeries = chart.addAreaSeries();
	const volumeSeries = chart.addHistogramSeries();

	areaSeries.setData(generateData());

	volumeSeries.setData(generateColoredData());

	return new Promise(resolve => {
		setTimeout(() => {
			volumeSeries.setData([]);
			resolve();
		}, 1000);
	});
}
