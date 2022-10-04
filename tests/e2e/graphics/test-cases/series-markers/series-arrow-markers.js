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

	const data = generateData();
	mainSeries.setData(data);

	mainSeries.setMarkers([
		{ time: data[data.length - 30].time, position: 'belowBar', color: 'orange', shape: 'arrowUp' },
		{ time: data[data.length - 30].time, position: 'belowBar', color: 'yellow', shape: 'arrowUp' },
		{ time: data[data.length - 30].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: data[data.length - 20].time, position: 'aboveBar', color: 'orange', shape: 'arrowDown' },
		{ time: data[data.length - 20].time, position: 'aboveBar', color: 'yellow', shape: 'arrowDown' },
		{ time: data[data.length - 20].time, position: 'aboveBar', color: 'red', shape: 'arrowDown' },
		{ time: data[data.length - 10].time, position: 'inBar', color: 'orange', shape: 'arrowUp' },
		{ time: data[data.length - 10].time, position: 'inBar', color: 'red', shape: 'arrowDown' },
	]);
}
