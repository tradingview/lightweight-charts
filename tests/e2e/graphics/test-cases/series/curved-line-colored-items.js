function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2000, 0, 1, 0, 0, 0, 0));
	let color = 'red';

	for (let i = 0; i < 25; ++i) {
		const item = {
			time: time.getTime() / 1000,
			value: Math.sin(i),
			color,
		};
		time.setUTCDate(time.getUTCDate() + 1);
		color = color === 'red' ? 'green' : 'red';

		res.push(item);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const lineSeries = chart.addLineSeries({
		lineType: LightweightCharts.LineType.Curved,
	});

	const data = generateData();
	lineSeries.setData(data);

	chart.timeScale().fitContent();
}
