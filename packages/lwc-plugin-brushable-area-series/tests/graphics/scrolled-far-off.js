function generateData(count, startIndex) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	time.setUTCDate(time.getUTCDate() + startIndex);
	for (let i = 0; i < count; ++i) {
		const j = i + startIndex;
		res.push({
			time: time.getTime() / 1000,
			value: 60 + Math.sin(j / 9) * 20 + Math.cos(j / 4) * 6,
		});
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

const fadeStyle = {
	lineColor: 'rgba(40, 98, 255, 0.2)',
	topColor: 'rgba(40, 98, 255, 0.05)',
	bottomColor: 'rgba(40, 98, 255, 0)',
	lineWidth: 2,
};

const greenStyle = {
	lineColor: 'rgb(4, 153, 129)',
	topColor: 'rgba(4, 153, 129, 0.4)',
	bottomColor: 'rgba(4, 153, 129, 0)',
	lineWidth: 4,
};

const orangeStyle = {
	lineColor: 'rgb(245, 124, 0)',
	topColor: 'rgba(245, 124, 0, 0.4)',
	bottomColor: 'rgba(245, 124, 0, 0)',
	lineWidth: 4,
};

// The view is set far in front of the data. The time scale clamps, so a single
// bar is left at the very edge: the renderer gets a visible range of one point,
// which is the degenerate case the old draw loop (which read `bars[from]` and
// then walked from `from + 1`) never covered. Nothing may throw, and the one
// remaining point is still drawn.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.BrushableAreaSeries(), Object.assign({
		priceLineVisible: false,
	}, greenStyle));
	series.setData(generateData(80, 0));
	series.applyOptions({
		brushRanges: [{ range: { from: 30, to: 50 }, style: orangeStyle }],
	});
	chart.timeScale().setVisibleLogicalRange({ from: -600, to: -500 });
	// Nothing is in view, so there is no crosshair movement to wait for.
	window.ignoreMouseMove = true;
}
