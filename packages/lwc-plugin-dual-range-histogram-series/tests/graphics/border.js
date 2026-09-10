function generateData() {
	const histogram = [];
	const line = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 40; ++i) {
		const outerUp = 80 + Math.sin(i / 5) * 40;
		const outerDown = -(70 + Math.cos(i / 4) * 30);
		histogram.push({
			time: time.getTime() / 1000,
			values: [
				outerUp,
				outerUp * (0.3 + Math.abs(Math.sin(i / 3)) * 0.4),
				outerDown,
				outerDown * (0.3 + Math.abs(Math.cos(i / 6)) * 0.4),
			],
		});
		line.push({ time: time.getTime() / 1000, value: Math.sin(i / 8) * 30 });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return { histogram, line };
}

// A real, configurable border: the fill is inset by half the border width and
// the border is stroked on top of it. Without `borderColor` no border is drawn
// and the fill occupies the full rectangle.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 20, minBarSpacing: 4 },
	}));
	const data = generateData();

	const histogram = LwcPlugin.createDualRangeHistogramSeries(chart, {
		priceLineVisible: false,
		lastValueVisible: false,
		borderColor: '#131722',
		borderWidth: 1,
		borderRadius: { upOuter: 4, upInner: 2, downOuter: 4, downInner: 2 },
		maxHeight: 200,
	});
	histogram.setData(data.histogram);

	const baseline = chart.addSeries(LightweightCharts.BaselineSeries, {
		baseValue: { type: 'price', price: 0 },
	});
	baseline.setData(data.line);

	chart.timeScale().fitContent();
	// The pixel-height columns are not part of the autoscale; the helper
	// reserves room for them on the price scale.
	LwcPlugin.keepPixelSeriesInView(chart, histogram);
}
