function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// zOrder is honoured: the 'bottom' label is drawn behind the thick line, the
// 'top' one over it.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries, { lineWidth: 4 });
	series.setData(generateData().map(point => ({ time: point.time, value: 50 })));
	chart.timeScale().fitContent();

	series.attachPrimitive(new LwcPlugin.AnchoredText({
		text: 'Behind the line',
		horzAlign: 'left',
		vertAlign: 'center',
		font: 'bold 32px Arial',
		color: '#F23645',
		zOrder: 'bottom',
	}));
	series.attachPrimitive(new LwcPlugin.AnchoredText({
		text: 'Over the line',
		horzAlign: 'right',
		vertAlign: 'center',
		font: 'bold 32px Arial',
		color: '#089981',
		zOrder: 'top',
	}));

	return new Promise(resolve => setTimeout(resolve, 300));
}
