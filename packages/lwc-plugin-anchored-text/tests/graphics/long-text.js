function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Text wider than the pane is neither wrapped nor scaled: a centered line
// overflows both edges and is clipped at the pane.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());
	chart.timeScale().fitContent();

	series.attachPrimitive(new LwcPlugin.AnchoredText({
		text: 'A line of text which is far too long to fit inside the pane at this size',
		horzAlign: 'center',
		vertAlign: 'center',
		font: 'bold 28px Arial',
	}));

	return new Promise(resolve => setTimeout(resolve, 300));
}
