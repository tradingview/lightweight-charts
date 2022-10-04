function generateData() {
	const res = [
		{
			time: new Date('2017-12-31').getTime() / 1000,
			value: 0,
		},
	];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	res.push(
		{
			time: new Date('2020-01-01').getTime() / 1000,
			value: 500,
		},
		{
			time: new Date('2020-01-02').getTime() / 1000,
			value: 500,
		}
	);

	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		timeScale: {
			fixLeftEdge: true,
			fixRightEdge: true,
		},
	});

	const series = chart.addLineSeries();

	series.setData(generateData());

	chart.timeScale().fitContent();
}
