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

// At a 2 px spacing the box is one device pixel wide at pixel ratio 1, and the
// outliers are still drawn, at their smallest radius of 1.5 px. The example
// skipped outlier dots when the box was 2 px or narrower, so they vanished
// here.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 2, minBarSpacing: 2 },
	}));
	const series = LwcPlugin.createBoxWhiskerSeries(chart);
	series.setData(generateData(200));
}
