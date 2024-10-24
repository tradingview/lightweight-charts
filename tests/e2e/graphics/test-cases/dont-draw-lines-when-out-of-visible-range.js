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
	const chart = (window.chart = LightweightCharts.createChart(container, {
		height: 500,
		width: 600,
		crosshair: {
			vertLine: {
				visible: false,
				labelVisible: false,
			},
			horzLine: {
				visible: false,
				labelVisible: false,
			},
		},
		layout: { attributionLogo: false },
	}));

	const whitespaceData = generateData().map(d => ({ time: d.time }));
	const whitespaceSeries = chart.addLineSeries();
	whitespaceSeries.setData(whitespaceData);

	const lineData = generateData().slice(-100);
	const lineSeries = chart.addLineSeries({
		priceLineVisible: false,
		lastValueVisible: false,
	});
	lineSeries.setData(lineData);

	const baselineData = generateData().slice(200, 300);
	const baselineSeries = chart.addBaselineSeries({
		baseValue: { type: 'price', price: baselineData[49].value },
		priceLineVisible: false,
		lastValueVisible: false,
	});
	baselineSeries.setData(baselineData);

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			chart.timeScale().fitContent();
			requestAnimationFrame(() => {
				chart.timeScale().setVisibleLogicalRange({ from: 0, to: 2 });
				requestAnimationFrame(() => resolve());
			});
		});
	});
}
