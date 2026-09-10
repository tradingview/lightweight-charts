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

// In `price` scale mode the values are prices measured from `baseValue`, so
// the columns are autoscaled by the price scale like any other series and both
// `maxHeight` and `normalize` are ignored. No scale margins are reserved: the
// price scale already knows how tall the columns are.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 12, minBarSpacing: 4 },
	}));
	const data = generateData();

	const histogram = LwcPlugin.createDualRangeHistogramSeries(chart, {
		priceLineVisible: false,
		lastValueVisible: false,
		scaleMode: 'price',
	});
	// Scaled down to the range of the baseline series, since both now share the
	// price scale.
	histogram.setData(data.histogram.map(point => ({
		time: point.time,
		values: point.values.map(value => value / 4),
	})));

	const baseline = chart.addSeries(LightweightCharts.BaselineSeries, {
		baseValue: { type: 'price', price: 0 },
	});
	baseline.setData(data.line);

	chart.timeScale().fitContent();
}
