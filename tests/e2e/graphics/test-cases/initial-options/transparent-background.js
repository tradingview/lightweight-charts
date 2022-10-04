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
		layout: {
			background: {
				type: LightweightCharts.ColorType.Solid,
				color: 'rgba(80, 80, 80, 0.5)',
			},
		},
	});

	const series = chart.addLineSeries();

	series.setData(generateData());

	chart.timeScale().setVisibleRange({ from: 1545782400, to: 1559692800 });

	return new Promise(resolve => {
		setTimeout(() => {
			chart.timeScale().setVisibleRange({ from: 1538352000, to: 1545782400 });
			resolve();
		}, 1000);
	});
}
