function generateBar(i, target) {
	const step = (i % 20) / 5000;
	const base = i / 5;
	target.value = base * (1 - step);

	if ((i % 10) > 4) {
		target.lineColor = 'yellow';
		target.topColor = 'black';
		target.bottomColor = 'blue';
	}
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

	const mainSeries = chart.addAreaSeries();

	mainSeries.setData(generateData());
}
