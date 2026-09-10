function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		res.push({ time: time.getTime() / 1000, value: 50 + Math.sin(i / 10) * 20 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

function svgToDataUrl(svgString) {
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

const imageDataUrl = svgToDataUrl(
	'<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">' +
	'<rect width="200" height="200" fill="#2962FF"/>' +
	'<circle cx="100" cy="100" r="70" fill="#FF9800"/>' +
	'</svg>'
);

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());
	chart.timeScale().fitContent();

	const watermark = new LwcPlugin.ImageWatermark(imageDataUrl, {
		alpha: 0.5,
		padding: 20,
	});
	series.attachPrimitive(watermark);

	return new Promise(resolve => setTimeout(resolve, 300));
}
