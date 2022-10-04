function generateData(count) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);

	const series = chart.addLineSeries();

	const data = generateData(10);
	series.setData(data);

	return new Promise(resolve => {
		setTimeout(() => {
			const timeScale = chart.timeScale();

			const range = { from: 0, to: 5 };
			timeScale.setVisibleLogicalRange(range);

			timeScale.subscribeVisibleLogicalRangeChange(newRange => {
				console.assert(newRange !== null, 'newRange shouldn\'t be null');
				console.assert(newRange.from === range.from, `from index should be the same as previously set, expected=${range.to}, actual=${newRange.from}`);
				console.assert(newRange.to === range.to, `to index should be the same as previously set, expected=${range.to}, actual=${newRange.to}`);

				resolve();
			});
		}, 500);
	});
}
