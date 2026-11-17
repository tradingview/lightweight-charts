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

// Every color option set, and two points, the 8th and the 13th, overriding
// all five colors on their own.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 16 },
	}));
	const series = LwcPlugin.createBoxWhiskerSeries(chart, {
		whiskerColor: '#131722',
		lowerBoxColor: '#90BFF9',
		upperBoxColor: '#2962FF',
		medianColor: '#FFFFFF',
		outlierColor: '#F23645',
	});
	const own = { whiskerColor: '#F23645', lowerBoxColor: '#089981', upperBoxColor: '#22AB94', medianColor: '#131722', outlierColor: '#089981' };
	series.setData(generateData().map((point, index) => (index === 7 || index === 12 ? { ...point, ...own } : point)));
	chart.timeScale().fitContent();
}
