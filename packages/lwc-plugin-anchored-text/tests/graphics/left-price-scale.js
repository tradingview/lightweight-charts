function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// The geometry comes from the pane, not the chart element: with a visible left
// price scale the left-anchored text still starts 20px inside the pane.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		leftPriceScale: { visible: true },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());
	chart.timeScale().fitContent();

	series.attachPrimitive(new LwcPlugin.AnchoredText({ text: 'Left scale visible' }));
	series.attachPrimitive(new LwcPlugin.AnchoredText({ text: 'Bottom left', vertAlign: 'bottom' }));

	return new Promise(resolve => setTimeout(resolve, 300));
}
