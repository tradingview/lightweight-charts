const startDate = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
const endDate = new Date(Date.UTC(2019, 0, 1, 0, 0, 0, 0));

function generateData() {
	const res = [];

	const time = new Date(startDate);
	for (let i = 0; time.getTime() < endDate.getTime(); ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i / 1000 + 0.6,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const firstSeries = chart.addLineSeries();
	const secondSeries = chart.addLineSeries();

	firstSeries.setData(generateData());
	secondSeries.setData([
		{ time: startDate.getTime() / 1000, value: 0.5 },
		{ time: endDate.getTime() / 1000, value: 0.5 },
	]);
}
