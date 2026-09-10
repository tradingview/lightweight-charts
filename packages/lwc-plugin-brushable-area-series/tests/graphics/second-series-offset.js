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

// The grey line series starts 20 bars EARLIER than the brushable series, so
// logical index 20 is the brushable series' FIRST point. brushRanges are
// documented as logical indices, but the renderer matches them against the
// index into its own bars array, so the highlight lands 20 bars to the right
// of the requested logical range - this case documents that bug.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));

	const line = chart.addSeries(LightweightCharts.LineSeries, { color: '#9E9E9E' });
	line.setData(generateData(80, 0));

	const series = chart.addCustomSeries(new LwcPlugin.BrushableAreaSeries(), Object.assign({
		priceLineVisible: false,
	}, fadeStyle));
	series.setData(generateData(60, 20));

	// Requested logical indices 30..49 (just left of centre); rendered at
	// logical 50..69 instead.
	series.applyOptions({
		brushRanges: [{ range: { from: 30, to: 50 }, style: greenStyle }],
	});
	chart.timeScale().fitContent();
}
