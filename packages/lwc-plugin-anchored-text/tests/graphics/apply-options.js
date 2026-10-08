function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// Options can be changed after the text is attached. The screenshot shows the
// second state: new text, bottom-right, blue, with a larger margin.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());
	chart.timeScale().fitContent();

	const text = new LwcPlugin.AnchoredText({ text: 'Before', color: '#F23645' });
	series.attachPrimitive(text);

	return new Promise(resolve => {
		setTimeout(() => {
			text.setText('After');
			text.applyOptions({
				horzAlign: 'right',
				vertAlign: 'bottom',
				horzMargin: 40,
				color: '#2962FF',
			});
			setTimeout(resolve, 300);
		}, 200);
	});
}
