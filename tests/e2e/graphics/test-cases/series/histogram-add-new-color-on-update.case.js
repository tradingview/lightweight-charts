function generateData() {
	var colors = [
		'#013370',
		undefined,
	];

	var res = [];
	var time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (var i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
			color: colors[i % colors.length],
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var mainSeries = chart.addHistogramSeries({
		lineWidth: 1,
		color: '#ff0000',
	});

	var data = generateData();
	var lastItem = data.splice(-1, 1)[0];
	mainSeries.setData(data);

	lastItem.color = '#ccaaee';
	mainSeries.update(lastItem);
}
