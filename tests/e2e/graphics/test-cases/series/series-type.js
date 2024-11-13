function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, { layout: { attributionLogo: false } });
	const line = chart.addSeries(LightweightCharts.LineSeries);
	const area = chart.addSeries(LightweightCharts.AreaSeries);
	const candlestick = chart.addSeries(LightweightCharts.CandlestickSeries);
	const bar = chart.addSeries(LightweightCharts.BarSeries);
	const histogram = chart.addSeries(LightweightCharts.HistogramSeries);

	console.assert(line.seriesType() === 'Line', 'line.seriesType() should return Line');
	console.assert(area.seriesType() === 'Area', 'area.seriesType() should return Area');
	console.assert(candlestick.seriesType() === 'Candlestick', 'candlestick.seriesType() should return Candlestick');
	console.assert(bar.seriesType() === 'Bar', 'bar.seriesType() should return Bar');
	console.assert(histogram.seriesType() === 'Histogram', 'histogram.seriesType() should return Histogram');
}
