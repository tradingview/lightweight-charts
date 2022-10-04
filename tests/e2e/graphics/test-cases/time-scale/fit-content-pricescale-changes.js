function generateData(down) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	const points = down ? 1000 : 10000;
	for (let i = 0; i < points; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: down ? 1000 - i : i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Ignore the mouse movement check because height of chart is too short
window.ignoreMouseMove = true;

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		width: 600,
		height: 300,
	});
	chart.applyOptions({
		timeScale: {
			fixLeftEdge: true,
			fixRightEdge: true,
		},
	});

	const data1 = generateData(false);
	const data2 = generateData(true);

	const areaSeries = chart.addAreaSeries();
	areaSeries.setData(data1);
	chart.timeScale().fitContent();

	chart.applyOptions({
		timeScale: {
			fixLeftEdge: true,
			fixRightEdge: true,
		},
	});
	chart.removeSeries(areaSeries);
	chart.addAreaSeries().setData(data2);
	chart.timeScale().fitContent();
}
