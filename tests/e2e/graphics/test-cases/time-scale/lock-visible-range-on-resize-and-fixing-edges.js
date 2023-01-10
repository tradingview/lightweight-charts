function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 10; ++i) {
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
		timeScale: {
			fixLeftEdge: true,
			fixRightEdge: true,
			lockVisibleTimeRangeOnResize: true,
		},
	});

	const series = chart.addLineSeries();

	const data = generateData();

	series.setData(data);

	chart.timeScale().setVisibleLogicalRange({ from: 0.5, to: data.length - 1.5 });

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			chart.applyOptions({ width: 550 });

			requestAnimationFrame(() => {
				chart.applyOptions({ width: 600 });

				requestAnimationFrame(() => {
					const visibleRange = chart.timeScale().getVisibleLogicalRange();
					console.assert(visibleRange.from === 0.5, `from in logical range should be 0.5, but is ${visibleRange.from}`);
					console.assert(visibleRange.to === data.length - 1.5, `to in logical range should be ${data.length - 1.5}, but is ${visibleRange.to}`);
					resolve();
				});
			});
		});
	});
}
