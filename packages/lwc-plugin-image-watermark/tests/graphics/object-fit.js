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

// A square image with an off-centre marker, so cropping is visible.
const imageDataUrl = svgToDataUrl(
	'<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">' +
	'<rect width="200" height="200" fill="#2962FF"/>' +
	'<circle cx="100" cy="100" r="70" fill="#FF9800"/>' +
	'<rect x="0" y="0" width="40" height="40" fill="#F23645"/>' +
	'</svg>'
);

function runTestCase(container) {
	// Three charts stacked, so the screenshoter's crosshair wait would never
	// resolve on the first of them.
	window.ignoreMouseMove = true;

	// The same image and the same drawing area, drawn with each objectFit:
	// contain fits it, cover fills and crops it, none draws it at 200x200.
	const fits = ['contain', 'cover', 'none'];
	const charts = fits.map((objectFit, index) => {
		const div = document.createElement('div');
		div.style.width = '100%';
		div.style.height = '200px';
		container.appendChild(div);

		const chart = LightweightCharts.createChart(div, {
			layout: { attributionLogo: false },
		});
		if (index === 0) {
			window.chart = chart;
		}
		const series = chart.addSeries(LightweightCharts.LineSeries);
		series.setData(generateData());
		chart.timeScale().fitContent();

		series.attachPrimitive(
			new LwcPlugin.ImageWatermark(imageDataUrl, {
				objectFit,
				maxWidth: 240,
				maxHeight: 120,
				padding: 10,
				alpha: 0.6,
			})
		);
		return chart;
	});

	return new Promise(resolve => setTimeout(() => resolve(charts.length), 300));
}
