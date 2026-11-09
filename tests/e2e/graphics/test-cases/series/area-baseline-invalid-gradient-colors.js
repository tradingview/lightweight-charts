// An unparsable gradient colour should not throw (CanvasGradient.addColorStop
// throws a SyntaxError for it) and should not stop the rest of the series
// from being drawn. The invalid colour stops fall back to transparent.

function generateData(withInvalidItemColors) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 100; ++i) {
		const item = {
			time: time.getTime() / 1000,
			value: 50 + 30 * Math.sin(i / 8),
		};
		if (withInvalidItemColors && (i % 20) > 14) {
			Object.assign(item, withInvalidItemColors);
		}
		time.setUTCDate(time.getUTCDate() + 1);
		res.push(item);
	}
	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });

	const areaSeries = chart.addSeries(LightweightCharts.AreaSeries, {
		lineColor: 'blue',
		topColor: 'not-a-color',
		bottomColor: 'rgba(0, 0, 255, 0.2)',
	});
	areaSeries.setData(generateData({ topColor: 'rgba(0, 128, 0, 0.6)', bottomColor: 'also-not-a-color' }));

	const baselineSeries = chart.addSeries(LightweightCharts.BaselineSeries, {
		baseValue: { type: 'price', price: 50 },
		topLineColor: 'green',
		bottomLineColor: 'red',
		topFillColor1: 'not-a-color',
		topFillColor2: 'rgba(0, 128, 0, 0.1)',
		bottomFillColor1: 'rgba(255, 0, 0, 0.1)',
		bottomFillColor2: '#nope',
	}, 1);
	baselineSeries.setData(generateData({ topFillColor2: 'invalid', bottomLineColor: 'orange' }));

	chart.timeScale().fitContent();
}
