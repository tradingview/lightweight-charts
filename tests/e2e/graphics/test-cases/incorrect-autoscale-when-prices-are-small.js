var startDate = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
var endDate = new Date(Date.UTC(2019, 0, 1, 0, 0, 0, 0));

function generateData() {
	var res = [];

	var time = new Date(startDate);
	for (var i = 0; time.getTime() < endDate.getTime(); ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i / 1000 + 0.6,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

// eslint-disable-next-line no-unused-vars
function runTestCase(container) {
	var chart = LightweightCharts.createChart(container);

	var firstSeries = chart.addLineSeries();
	var secondSeries = chart.addLineSeries();

	firstSeries.setData(generateData());
	secondSeries.setData([
		{ time: startDate.getTime() / 1000, value: 0.5 },
		{ time: endDate.getTime() / 1000, value: 0.5 },
	]);
}
