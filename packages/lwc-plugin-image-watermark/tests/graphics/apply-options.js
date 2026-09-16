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

function image(color) {
	return svgToDataUrl(
		'<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">' +
		`<rect width="200" height="200" fill="${color}"/>` +
		'<circle cx="100" cy="100" r="70" fill="#FFFFFF"/>' +
		'</svg>'
	);
}

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());
	chart.timeScale().fitContent();

	const watermark = new LwcPlugin.ImageWatermark(image('#2962FF'), {
		alpha: 0.2,
		padding: 20,
	});
	series.attachPrimitive(watermark);

	// Options and the image can both be changed after the watermark is
	// attached. The screenshot shows the second image, in the bottom-right
	// corner, at maxWidth 150 and alpha 0.7.
	return new Promise(resolve => {
		setTimeout(() => {
			watermark.setImage(image('#089981'));
			watermark.applyOptions({
				position: 'bottom-right',
				maxWidth: 150,
				alpha: 0.7,
			});
			setTimeout(resolve, 300);
		}, 200);
	});
}
