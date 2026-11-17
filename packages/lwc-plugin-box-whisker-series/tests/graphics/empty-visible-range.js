function generateData(count = 30, center = 50) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		const mid = center + Math.sin(i / 5) * 10;
		const spread = 6 + (i % 4) * 2;
		const point = {
			time: time.getTime() / 1000,
			min: mid - spread * 2,
			q1: mid - spread,
			median: mid,
			q3: mid + spread * 0.8,
			max: mid + spread * 1.8,
		};
		if (i % 5 === 2) {
			point.outliers = [mid - spread * 2.6, mid + spread * 2.5];
		}
		res.push(point);
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Only a run of whitespace is in view, so the series has no point to draw and
// its visible range is empty; nothing is drawn and nothing throws.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = LwcPlugin.createBoxWhiskerSeries(chart);
	series.setData(generateData(200).map((point, index) => (index >= 20 && index < 180 ? { time: point.time } : point)));
	chart.timeScale().setVisibleLogicalRange({ from: 80, to: 120 });
}
