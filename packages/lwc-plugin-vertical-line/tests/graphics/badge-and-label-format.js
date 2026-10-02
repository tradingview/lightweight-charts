function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Text badges on the line, and the two label sources: a `labelText` left empty
// falls back to the chart's own time format, and `labelFormatter` overrides it.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	const data = generateData();
	series.setData(data);

	series.attachPrimitive(new LwcPlugin.VerticalLine(data[20].time, {
		color: '#089981',
		width: 2,
		showLabel: true,
		badge: { text: 'Top right', backgroundColor: '#089981' },
	}));
	series.attachPrimitive(new LwcPlugin.VerticalLine(data[50].time, {
		color: '#2962FF',
		width: 2,
		showLabel: true,
		labelFormatter: () => 'Formatted',
		badge: {
			text: 'Middle left',
			backgroundColor: '#FFFFFF',
			color: '#2962FF',
			borderColor: '#2962FF',
			borderWidth: 1,
			verticalAlign: 'middle',
			horizontalAlign: 'left',
		},
	}));
	series.attachPrimitive(new LwcPlugin.VerticalLine(data[80].time, {
		color: '#F23645',
		width: 2,
		showLabel: true,
		tickVisible: false,
		badge: {
			text: 'Bottom',
			backgroundColor: '#F23645',
			verticalAlign: 'bottom',
		},
	}));

	chart.timeScale().fitContent();
}
