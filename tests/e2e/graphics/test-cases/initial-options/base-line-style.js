function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 1; i < 500; ++i) {
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
			mode: LightweightCharts.PriceScaleMode.Percentage,
		},
	});

	const firstSeries = chart.addLineSeries({
		baseLineVisible: true,
		baseLineWidth: 3,
		baseLineColor: '#1215BE',
		baseLineStyle: LightweightCharts.LineStyle.LargeDashed,
	});

	firstSeries.setData(generateData());
}
