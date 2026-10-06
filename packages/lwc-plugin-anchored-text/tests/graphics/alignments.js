function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// One instance per anchor pair, each in its own colour, so the margin and the
// centring maths are visible for all nine positions at once.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());
	chart.timeScale().fitContent();

	const colors = {
		top: '#089981',
		center: '#2962FF',
		bottom: '#F23645',
	};
	for (const vertAlign of ['top', 'center', 'bottom']) {
		for (const horzAlign of ['left', 'center', 'right']) {
			series.attachPrimitive(new LwcPlugin.AnchoredText({
				text: `${vertAlign} ${horzAlign}`,
				horzAlign,
				vertAlign,
				color: colors[vertAlign],
			}));
		}
	}

	return new Promise(resolve => setTimeout(resolve, 300));
}
