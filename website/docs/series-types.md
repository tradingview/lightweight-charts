---
sidebar_position: 1
---

# Series types

In this article you can read a brief overview of all supported series types.

## A series customizations

Any type of series can be customized and the set of available options that you can apply depends on a type of a series (see docs for each series type below).

If you'd like to change any option of a series, you could do this in different ways:

1. You can specify the default options while creating a series:

    ```js
    // change default top & bottom colors of an area series in creating time
    const series = chart.addAreaSeries({
        topColor: 'red',
        bottomColor: 'green',
    });
    ````

    Note that every method to create a series has an optional `options` parameter.

1. You can use [`ISeriesApi.applyOptions`](/api/interfaces/ISeriesApi.md#applyoptions) method to apply other options on the fly:

    ```js
    // updating candlestick series options on the fly
    candlestickSeries.applyOptions({
        upColor: 'red',
        downColor: 'blue',
    });
    ```

## Area

- **Method to create**: [`IChartApi.addAreaSeries`](/api/interfaces/IChartApi.md#addareaseries)
- **Data format**: [`SingleValueData`](/api/interfaces/SingleValueData.md) or [`WhitespaceData`](/api/interfaces/WhitespaceData.md)
- **Style options**: a mix of [`SeriesOptionsCommon`](/api/interfaces/SeriesOptionsCommon.md) and [`AreaStyleOptions`](/api/interfaces/AreaStyleOptions.md)

An area chart is basically a colored area between the line connecting all data points and [the time scale](./time-scale.md):

![Area chart example](/img/area-series.png "Area chart example")

## Bar

- **Method to create**: [`IChartApi.addBarSeries`](/api/interfaces/IChartApi.md#addbarseries)
- **Data format**: [`BarData`](/api/interfaces/BarData.md) or [`WhitespaceData`](/api/interfaces/WhitespaceData.md)
- **Style options**: a mix of [`SeriesOptionsCommon`](/api/interfaces/SeriesOptionsCommon.md) and [`BarStyleOptions`](/api/interfaces/BarStyleOptions.md)

A bar chart shows price movements in the form of bars.

Vertical line length of a bar is limited by the highest and lowest price values.
Open & Close values are represented by tick marks, on the left & right hand side of the bar respectively:

![Bar chart example](/img/bar-series.png "Bar chart example")

## Baseline

- **Method to create**: [`IChartApi.addBaselineSeries`](/api/interfaces/IChartApi.md#addbaselineseries)
- **Data format**: [`SingleValueData`](/api/interfaces/SingleValueData.md) or [`WhitespaceData`](/api/interfaces/WhitespaceData.md)
- **Style options**: a mix of [`SeriesOptionsCommon`](/api/interfaces/SeriesOptionsCommon.md) and [`BaselineStyleOptions`](/api/interfaces/BaselineStyleOptions.md)

A baseline is basically two colored areas (top and bottom) between the line connecting all data points and [the base value line](/api/interfaces/BaselineStyleOptions.md#basevalue):

![Baseline chart example](/img/baseline-series.png)

## Candlestick

- **Method to create**: [`IChartApi.addCandlestickSeries`](/api/interfaces/IChartApi.md#addcandlestickseries)
- **Data format**: [`CandlestickData`](/api/interfaces/CandlestickData.md) or [`WhitespaceData`](/api/interfaces/WhitespaceData.md)
- **Style options**: a mix of [`SeriesOptionsCommon`](/api/interfaces/SeriesOptionsCommon.md) and [`CandlestickStyleOptions`](/api/interfaces/CandlestickStyleOptions.md)

A candlestick chart shows price movements in the form of candlesticks.
On the candlestick chart, open & close values form a solid body of a candle while wicks show high & low values for a candlestick's time interval:

![Candlestick chart example](/img/candlestick-series.png "Candlestick chart example")

## Histogram

- **Method to create**: [`IChartApi.addHistogramSeries`](/api/interfaces/IChartApi.md#addhistogramseries)
- **Data format**: [`HistogramData`](/api/interfaces/HistogramData.md) or [`WhitespaceData`](/api/interfaces/WhitespaceData.md)
- **Style options**: a mix of [`SeriesOptionsCommon`](/api/interfaces/SeriesOptionsCommon.md) and [`HistogramStyleOptions`](/api/interfaces/HistogramStyleOptions.md)

A histogram series is a graphical representation of the value distribution.
Histogram creates intervals (columns) and counts how many values fall into each column:

![Histogram example](/img/histogram-series.png "Histogram chart example")

## Line

- **Method to create**: [`IChartApi.addLineSeries`](/api/interfaces/IChartApi.md#addlineseries)
- **Data format**: [`LineData`](/api/interfaces/LineData.md) or [`WhitespaceData`](/api/interfaces/WhitespaceData.md)
- **Style options**: a mix of [`SeriesOptionsCommon`](/api/interfaces/SeriesOptionsCommon.md) and [`LineStyleOptions`](/api/interfaces/LineStyleOptions.md)

A line chart is a type of chart that displays information as series of the data points connected by straight line segments:

![Line chart example](/img/line-series.png "Line chart example")

<!--
Please use the following snippet to update the screenshots below (make sure that DPR=2):

```js
function generateLineData() {
	return [
		{ time: '2019-05-01', value: 56.52 },
		{ time: '2019-05-02', value: 56.99 },
		{ time: '2019-05-03', value: 57.24 },
		{ time: '2019-05-06', value: 56.91 },
		{ time: '2019-05-07', value: 56.63 },
		{ time: '2019-05-08', value: 56.38 },
		{ time: '2019-05-09', value: 56.48 },
		{ time: '2019-05-10', value: 56.91 },
		{ time: '2019-05-13', value: 56.75 },
		{ time: '2019-05-14', value: 56.55 },
		{ time: '2019-05-15', value: 56.81 },
		{ time: '2019-05-16', value: 57.38 },
		{ time: '2019-05-17', value: 58.09 },
		{ time: '2019-05-20', value: 59.01 },
		{ time: '2019-05-21', value: 59.50 },
		{ time: '2019-05-22', value: 59.25 },
		{ time: '2019-05-23', value: 58.87 },
		{ time: '2019-05-24', value: 59.32 },
		{ time: '2019-05-28', value: 59.57 },
	];
}

function generateHistogramData() {
	return [
		{ time: '2019-05-01', value: 11627436.00, color: 'rgba(255,82,82, 0.8)' },
		{ time: '2019-05-02', value: 14435436.00, color: 'rgba(0, 150, 136, 0.8)' },
		{ time: '2019-05-03', value: 9388228.00, color: 'rgba(0, 150, 136, 0.8)' },
		{ time: '2019-05-06', value: 10066145.00, color: 'rgba(255,82,82, 0.8)' },
		{ time: '2019-05-07', value: 12963827.00, color: 'rgba(255,82,82, 0.8)' },
		{ time: '2019-05-08', value: 12086743.00, color: 'rgba(255,82,82, 0.8)' },
		{ time: '2019-05-09', value: 14835326.00, color: 'rgba(0, 150, 136, 0.8)' },
		{ time: '2019-05-10', value: 10707335.00, color: 'rgba(0, 150, 136, 0.8)' },
		{ time: '2019-05-13', value: 13759350.00, color: 'rgba(255,82,82, 0.8)' },
		{ time: '2019-05-14', value: 12776175.00, color: 'rgba(255,82,82, 0.8)' },
		{ time: '2019-05-15', value: 10806379.00, color: 'rgba(0, 150, 136, 0.8)' },
		{ time: '2019-05-16', value: 11695064.00, color: 'rgba(0, 150, 136, 0.8)' },
		{ time: '2019-05-17', value: 14436662.00, color: 'rgba(0, 150, 136, 0.8)' },
		{ time: '2019-05-20', value: 20910590.00, color: 'rgba(0, 150, 136, 0.8)' },
		{ time: '2019-05-21', value: 14016315.00, color: 'rgba(0, 150, 136, 0.8)' },
		{ time: '2019-05-22', value: 11487448.00, color: 'rgba(255,82,82, 0.8)' },
		{ time: '2019-05-23', value: 11707083.00, color: 'rgba(255,82,82, 0.8)' },
		{ time: '2019-05-24', value: 8755506.00, color: 'rgba(0, 150, 136, 0.8)' },
		{ time: '2019-05-28', value: 3097125.00, color: 'rgba(0, 150, 136, 0.8)' },
	];
}

function generateBarData() {
	return [
		{ time: '2019-05-01', open: 203.20, high: 203.52, low: 198.66, close: 198.80 },
		{ time: '2019-05-02', open: 199.30, high: 201.06, low: 198.80, close: 201.01 },
		{ time: '2019-05-03', open: 202.00, high: 202.31, low: 200.32, close: 200.56 },
		{ time: '2019-05-06', open: 198.74, high: 199.93, low: 198.31, close: 199.63 },
		{ time: '2019-05-07', open: 196.75, high: 197.65, low: 192.96, close: 194.77 },
		{ time: '2019-05-08', open: 194.49, high: 196.61, low: 193.68, close: 195.17 },
		{ time: '2019-05-09', open: 193.31, high: 195.08, low: 191.59, close: 194.58 },
		{ time: '2019-05-10', open: 193.21, high: 195.49, low: 190.01, close: 194.58 },
		{ time: '2019-05-13', open: 191.00, high: 191.66, low: 189.14, close: 190.34 },
		{ time: '2019-05-14', open: 190.50, high: 192.76, low: 190.01, close: 191.62 },
		{ time: '2019-05-15', open: 190.81, high: 192.81, low: 190.27, close: 191.76 },
		{ time: '2019-05-16', open: 192.47, high: 194.96, low: 192.20, close: 192.38 },
		{ time: '2019-05-17', open: 190.86, high: 194.50, low: 190.75, close: 192.58 },
		{ time: '2019-05-20', open: 191.13, high: 192.86, low: 190.61, close: 190.95 },
		{ time: '2019-05-21', open: 187.13, high: 192.52, low: 186.34, close: 191.45 },
		{ time: '2019-05-22', open: 190.49, high: 192.22, low: 188.05, close: 188.91 },
		{ time: '2019-05-23', open: 188.45, high: 192.54, low: 186.27, close: 192.00 },
		{ time: '2019-05-24', open: 192.54, high: 193.86, low: 190.41, close: 193.59 },
		{ time: '2019-05-28', open: 194.38, high: 196.47, low: 193.75, close: 194.08 },
	];
}

function runTestCase() {
	const container = document.createElement('div');
	document.body.appendChild(container);

	const areaChart = window.areaChart = LightweightCharts.createChart(container, { width: 600, height: 300 });
	areaChart.timeScale().fitContent();
	areaChart.addAreaSeries().setData(generateLineData());

	const barChart = window.barChart = LightweightCharts.createChart(container, { width: 600, height: 300 });
	barChart.timeScale().fitContent();
	barChart.addBarSeries().setData(generateBarData());

	const baselineChart = window.baselineChart = LightweightCharts.createChart(container, { width: 600, height: 300 });
	baselineChart.timeScale().fitContent();
	baselineChart.addBaselineSeries({ baseValue: { price: 57.5 } }).setData(generateLineData());

	const candlestickChart = window.candlestickChart = LightweightCharts.createChart(container, { width: 600, height: 300 });
	candlestickChart.timeScale().fitContent();
	candlestickChart.addCandlestickSeries().setData(generateBarData());

	const histogramChart = window.histogramChart = LightweightCharts.createChart(container, { width: 600, height: 300 });
	histogramChart.timeScale().fitContent();
	histogramChart.addHistogramSeries({ priceFormat: { type: 'volume' } }).setData(generateHistogramData());

	const lineChart = window.lineChart = LightweightCharts.createChart(container, { width: 600, height: 300 });
	lineChart.timeScale().fitContent();
	lineChart.addLineSeries().setData(generateLineData());
}
```

- then use `copy(chartVarName.takeScreenshot().toDataURL())` (e.g. `copy(lineChart.takeScreenshot().toDataURL())`)
- paste the result into URL bar of the new tab
- save image as
- profit
-->
