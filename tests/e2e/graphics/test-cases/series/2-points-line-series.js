function generateBar(i, target) {
	const step = (i % 20) / 1000;
	const base = i / 5;
	target.open = base * (1 - step);
	target.high = base * (1 + 2 * step);
	target.low = base * (1 - 2 * step);
	target.close = base * (1 + step);
}

function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		const item = {
			time: time.getTime() / 1000,
		};
		time.setUTCDate(time.getUTCDate() + 1);

		generateBar(i, item);
		res.push(item);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addBarSeries();
	const lineSeries = chart.addLineSeries();

	const data = generateData();
	const lineData = [
		{ time: data[0].time, value: data[0].close },
		{ time: data[data.length - 1].time, value: data[data.length - 1].close },
	];

	mainSeries.setData(data);
	lineSeries.setData(lineData);

	chart.timeScale().scrollToPosition(-5);
}
