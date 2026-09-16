function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// `snap: 'nearest'` places a line whose time is not a bar of the chart on the
// closest bar instead of dropping it: the same two times as
// `time-not-in-data.js`, which draws nothing at all with the default 'exact'.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = generateData();
	series.setData(data);

	const betweenBarsTime = (data[40].time + data[41].time) / 2;
	series.attachPrimitive(new LwcPlugin.VerticalLine(betweenBarsTime, {
		snap: 'nearest',
		showLabel: true,
		labelText: 'Between bars',
		color: 'orange',
	}));

	// Past the end of the data: the nearest bar is the last one.
	const outsideRangeTime = data[data.length - 1].time + 86400 * 30;
	series.attachPrimitive(new LwcPlugin.VerticalLine(outsideRangeTime, {
		snap: 'nearest',
		showLabel: true,
		labelText: 'Outside range',
		color: 'purple',
	}));

	chart.timeScale().fitContent();
}
