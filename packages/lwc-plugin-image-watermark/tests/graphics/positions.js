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
		'<svg width="100" height="50" xmlns="http://www.w3.org/2000/svg">' +
		`<rect width="100" height="50" fill="${color}"/>` +
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

	// Each corner, plus a fractional anchor centred on the top edge. Every
	// watermark keeps its natural 100x50 size and sits inside the pane, clear
	// of the price scale and the time scale.
	const placements = [
		['top-left', '#2962FF'],
		['top-right', '#FF9800'],
		['bottom-left', '#089981'],
		['bottom-right', '#F23645'],
		[{ x: 0.5, y: 0 }, '#9C27B0'],
	];
	placements.forEach(([position, color]) => {
		series.attachPrimitive(
			new LwcPlugin.ImageWatermark(image(color), {
				position,
				objectFit: 'none',
				padding: 12,
				alpha: 0.8,
			})
		);
	});

	return new Promise(resolve => setTimeout(resolve, 300));
}
