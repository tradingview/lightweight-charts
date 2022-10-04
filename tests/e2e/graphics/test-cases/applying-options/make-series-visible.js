function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		rightPriceScale: {
			mode: LightweightCharts.PriceScaleMode.IndexedTo100,
		},
	});
	const lineSeries = chart.addLineSeries({
		visible: false,
		baseLineVisible: true,
	});
	const data = generateData();
	lineSeries.setData(data);
	lineSeries.setMarkers([
		{ time: data[data.length - 30].time, position: 'belowBar', color: 'orange', shape: 'arrowUp' },
		{ time: data[data.length - 30].time, position: 'belowBar', color: 'yellow', shape: 'arrowUp' },
		{ time: data[data.length - 30].time, position: 'belowBar', color: 'red', shape: 'arrowUp' },
		{ time: data[data.length - 20].time, position: 'aboveBar', color: 'orange', shape: 'arrowDown' },
		{ time: data[data.length - 20].time, position: 'aboveBar', color: 'yellow', shape: 'arrowDown' },
		{ time: data[data.length - 20].time, position: 'aboveBar', color: 'red', shape: 'arrowDown' },
		{ time: data[data.length - 10].time, position: 'inBar', color: 'orange', shape: 'arrowUp' },
		{ time: data[data.length - 10].time, position: 'inBar', color: 'red', shape: 'arrowDown' },
	]);

	return new Promise(resolve => {
		setTimeout(() => {
			lineSeries.applyOptions({
				visible: true,
			});

			setTimeout(resolve, 300);
		}, 300);
	});
}
