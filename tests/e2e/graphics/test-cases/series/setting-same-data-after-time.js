function copy(data) {
	return JSON.parse(JSON.stringify(data));
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);
	const lineSeries = chart.addLineSeries();

	const data = [
		{ time: '2019-04-11', value: 80.01 },
		{ time: '2019-04-12', value: 96.63 },
		{ time: '2019-04-13', value: 76.64 },
		{ time: '2019-04-14', value: 81.89 },
		{ time: '2019-04-15', value: 74.43 },
		{ time: '2019-04-16', value: 80.01 },
		{ time: '2019-04-17', value: 96.63 },
		{ time: '2019-04-18', value: 76.64 },
		{ time: '2019-04-19', value: 81.89 },
		{ time: '2019-04-20', value: 74.43 },
	];

	lineSeries.setData(copy(data));

	return new Promise(resolve => {
		setTimeout(() => {
			chart.removeSeries(lineSeries);

			setTimeout(() => {
				const newLineSeries = chart.addLineSeries();

				setTimeout(() => {
					newLineSeries.setData(copy(data));
					resolve();
				}, 200);
			}, 200);
		}, 200);
	});
}
