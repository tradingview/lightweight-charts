function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = generateData();
	series.setData(data);

	// A time between two bars: not a bar of the series, so no coordinate is
	// found for the line itself. The time-axis label is shown regardless
	// (its visibility does not depend on the line having a valid position),
	// so it is drawn at coordinate 0 instead of being hidden.
	const betweenBarsTime = (data[40].time + data[41].time) / 2;
	series.attachPrimitive(new LwcPlugin.VerticalLine(betweenBarsTime, {
		showLabel: true,
		labelText: 'Between bars',
		color: 'orange',
	}));

	// A time well outside the data range: same stray-label behaviour.
	const outsideRangeTime = data[data.length - 1].time + 86400 * 30;
	series.attachPrimitive(new LwcPlugin.VerticalLine(outsideRangeTime, {
		showLabel: true,
		labelText: 'Outside range',
		color: 'purple',
	}));

	chart.timeScale().fitContent();
}
