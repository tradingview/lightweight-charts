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

// Points 15..23 have no `values`, so they are whitespace. The columns on
// either side of the gap must keep their own width and position: the column
// alignment is not carried across the gap.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 12, minBarSpacing: 4 },
	}));
	const data = generateData();

	const histogram = LwcPlugin.createDualRangeHistogramSeries(chart, {
		priceLineVisible: false,
		lastValueVisible: false,
		borderRadius: { upOuter: 3, upInner: 0, downOuter: 3, downInner: 0 },
	});
	histogram.setData(data.histogram.map((point, index) => {
		if (index >= 15 && index < 24) {
			return { time: point.time };
		}
		return point;
	}));

	const baseline = chart.addSeries(LightweightCharts.BaselineSeries, {
		baseValue: { type: 'price', price: 0 },
	});
	baseline.setData(data.line);

	chart.timeScale().fitContent();
	// The pixel-height columns are not part of the autoscale; the helper
	// reserves room for them on the price scale.
	LwcPlugin.keepPixelSeriesInView(chart, histogram);
}
