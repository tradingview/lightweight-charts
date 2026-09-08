// Parked (not discovered) until the draw-before-load fix lands: on Linux the
// first paint can run before the image's onerror, and drawImage throws on an
// HTMLImageElement in the 'broken' state.
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
	series.setData(generateData());
	chart.timeScale().fitContent();

	// A data: URL with invalid SVG content: the <img> fails to decode, which
	// fires onerror without any network request, so nothing is reported as a
	// console/network error by the screenshoter. The chart should render
	// normally, just without the watermark.
	const watermark = new LwcPlugin.ImageWatermark('data:image/svg+xml,broken', {
		alpha: 0.5,
		padding: 20,
	});
	series.attachPrimitive(watermark);

	return new Promise(resolve => setTimeout(resolve, 300));
}
