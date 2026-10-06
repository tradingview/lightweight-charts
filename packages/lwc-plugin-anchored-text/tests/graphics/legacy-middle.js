function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// The exact options object of the plugin-examples version: 'middle' on both
// axes is read as 'center', and the explicit lineHeight puts the baseline at
// its bottom, so the text renders where the example drew it.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());
	chart.timeScale().fitContent();

	series.attachPrimitive(new LwcPlugin.AnchoredText({
		vertAlign: 'middle',
		horzAlign: 'middle',
		text: 'Anchored Text',
		lineHeight: 54,
		font: 'italic bold 54px Arial',
		color: 'red',
	}));

	return new Promise(resolve => setTimeout(resolve, 300));
}
