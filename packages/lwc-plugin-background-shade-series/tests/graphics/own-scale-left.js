function generateData(count = 60, low = 0, high = 100) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		const ratio = (Math.sin(i / 6) + 1) / 2;
		res.push({ time: time.getTime() / 1000, value: Math.round((low + ratio * (high - low)) * 100) / 100 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function lineData(shade) {
	return shade.map((point, index) => ({ time: point.time, value: 100 + Math.sin(index / 3) * 10 }));
}

// The main series on the left price scale, the shade added through the
// factory on a scale of its own: the left axis shows the line's prices only,
// the right axis stays hidden, and the shade still covers the whole pane.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		leftPriceScale: { visible: true },
		rightPriceScale: { visible: false },
	}));
	const line = chart.addSeries(LightweightCharts.LineSeries, { color: '#131722', priceScaleId: 'left' });
	line.setData(lineData(generateData()));
	const shade = LwcPlugin.createBackgroundShadeSeries(chart);
	shade.setData(generateData());
	chart.timeScale().fitContent();
}
