function generateData() {
	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 30; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function generateColoredData() {
	var data = generateData();
	data.forEach((item, index) => {
		item.color = index % 2 === 0 ? 'rgba(0, 150, 136, 0.8)' : 'rgba(255,82,82, 0.8)';
	});

	return data;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var areaSeries = chart.addAreaSeries();
	var volumeSeries = chart.addHistogramSeries();

	areaSeries.setData(generateData());

	volumeSeries.setData(generateColoredData());

	return new Promise((resolve) => {
		setTimeout(() => {
			volumeSeries.setData([]);
			resolve();
		}, 1000);
	});
}
