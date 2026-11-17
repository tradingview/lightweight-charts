function generateData(count = 60, center = 100) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		res.push({ time: time.getTime() / 1000, value: center + Math.sin(i / 6) * 10 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// The button follows the pointer, and the test runner leaves the pointer in
// the middle of the page. A still card shows the button by sizing the chart
// so that its pane ends `distance` px right of the pointer: within 22 px the
// pointer is on the button, which then takes the hover color.
function endPaneNearPointer(chart, container, distance) {
	return new Promise(resolve => {
		requestAnimationFrame(() => {
			const box = container.getBoundingClientRect();
			chart.resize(Math.round(box.width / 2 + distance + chart.priceScale('right').width()), Math.round(box.height));
			requestAnimationFrame(resolve);
		});
	});
}

// A series around 0, a line added at 0 and the button near it: the original
// hid the button for a price of 0. The interaction test of the same name
// clicks a pixel row at exactly 0.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData(60, 0));
	const lines = new LwcPlugin.UserPriceLines({ lineColor: '#2962FF' });
	series.attachPrimitive(lines);
	lines.addLine(0);
	chart.timeScale().fitContent();
	return endPaneNearPointer(chart, container, 32);
}
