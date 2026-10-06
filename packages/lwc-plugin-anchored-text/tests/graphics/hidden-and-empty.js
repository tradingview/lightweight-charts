function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Neither a hidden label nor an empty one draws anything: the screenshot is a
// bare chart.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());
	chart.timeScale().fitContent();

	series.attachPrimitive(new LwcPlugin.AnchoredText({ text: 'Hidden', visible: false }));
	series.attachPrimitive(new LwcPlugin.AnchoredText({ text: '', vertAlign: 'bottom' }));

	return new Promise(resolve => setTimeout(resolve, 300));
}
