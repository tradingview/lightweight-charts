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

// The base style stays vivid and `outsideStyle` fades everything outside the
// range. Both the range style and `outsideStyle` are partial: the properties
// they leave out (`bottomColor`, and `lineWidth` for the faded part) come from
// the base style.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addCustomSeries(new LwcPlugin.BrushableAreaSeries(), {
		priceLineVisible: false,
	});
	series.setData(generateData(80, 0));
	series.applyOptions({
		brushRanges: [
			{
				range: { from: 30, to: 50 },
				style: {
					lineColor: 'rgb(4, 153, 129)',
					topColor: 'rgba(4, 153, 129, 0.4)',
					lineWidth: 4,
				},
			},
		],
		outsideStyle: {
			lineColor: 'rgba(40, 98, 255, 0.2)',
			topColor: 'rgba(40, 98, 255, 0.05)',
		},
	});
	chart.timeScale().fitContent();
}
