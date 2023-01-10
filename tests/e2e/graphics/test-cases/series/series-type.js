function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container);
	const line = chart.addLineSeries();
	const area = chart.addAreaSeries();
	const candlestick = chart.addCandlestickSeries();
	const bar = chart.addBarSeries();
	const histogram = chart.addHistogramSeries();

	console.assert(line.seriesType() === 'Line', 'line.seriesType() should return Line');
	console.assert(area.seriesType() === 'Area', 'area.seriesType() should return Area');
	console.assert(candlestick.seriesType() === 'Candlestick', 'candlestick.seriesType() should return Candlestick');
	console.assert(bar.seriesType() === 'Bar', 'bar.seriesType() should return Bar');
	console.assert(histogram.seriesType() === 'Histogram', 'histogram.seriesType() should return Histogram');
}
