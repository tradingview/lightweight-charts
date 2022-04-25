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

```js chart replaceThemeConstants
const chartOptions = { layout: { textColor: CHART_TEXT_COLOR, background: { type: 'solid', color: CHART_BACKGROUND_COLOR } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const areaSeries = chart.addAreaSeries({ lineColor: LINE_LINE_COLOR, topColor: AREA_TOP_COLOR, bottomColor: AREA_BOTTOM_COLOR });

const data = [{ value: 0, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922 }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722 }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922 }];

areaSeries.setData(data);

chart.timeScale().fitContent();
```

## Bar

- **Method to create**: [`IChartApi.addBarSeries`](/api/interfaces/IChartApi.md#addbarseries)
- **Data format**: [`BarData`](/api/interfaces/BarData.md) or [`WhitespaceData`](/api/interfaces/WhitespaceData.md)
- **Style options**: a mix of [`SeriesOptionsCommon`](/api/interfaces/SeriesOptionsCommon.md) and [`BarStyleOptions`](/api/interfaces/BarStyleOptions.md)

A bar chart shows price movements in the form of bars.

Vertical line length of a bar is limited by the highest and lowest price values.
Open & Close values are represented by tick marks, on the left & right hand side of the bar respectively:

```js chart replaceThemeConstants
const chartOptions = { layout: { textColor: CHART_TEXT_COLOR, background: { type: 'solid', color: CHART_BACKGROUND_COLOR } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const barSeries = chart.addBarSeries({ upColor: BAR_UP_COLOR, downColor: BAR_DOWN_COLOR });

const data = [{ open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 }, { open: 9.55, high: 10.30, low: 9.42, close: 9.94, time: 1642514276 }, { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 }, { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 }, { open: 9.51, high: 10.46, low: 9.10, close: 10.17, time: 1642773476 }, { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 }, { open: 10.47, high: 11.39, low: 10.40, close: 10.81, time: 1642946276 }, { open: 10.81, high: 11.60, low: 10.30, close: 10.75, time: 1643032676 }, { open: 10.75, high: 11.60, low: 10.49, close: 10.93, time: 1643119076 }, { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 }];

barSeries.setData(data);

chart.timeScale().fitContent();
```

## Baseline

- **Method to create**: [`IChartApi.addBaselineSeries`](/api/interfaces/IChartApi.md#addbaselineseries)
- **Data format**: [`SingleValueData`](/api/interfaces/SingleValueData.md) or [`WhitespaceData`](/api/interfaces/WhitespaceData.md)
- **Style options**: a mix of [`SeriesOptionsCommon`](/api/interfaces/SeriesOptionsCommon.md) and [`BaselineStyleOptions`](/api/interfaces/BaselineStyleOptions.md)

A baseline is basically two colored areas (top and bottom) between the line connecting all data points and [the base value line](/api/interfaces/BaselineStyleOptions.md#basevalue):

```js chart replaceThemeConstants
const chartOptions = { layout: { textColor: CHART_TEXT_COLOR, background: { type: 'solid', color: CHART_BACKGROUND_COLOR } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const baselineSeries = chart.addBaselineSeries({ baseValue: { type: 'price', price: 25 }, topLineColor: BASELINE_TOP_LINE_COLOR, topFillColor1: BASELINE_TOP_FILL_COLOR1, topFillColor2: BASELINE_TOP_FILL_COLOR2, bottomLineColor: BASELINE_BOTTOM_LINE_COLOR, bottomFillColor1: BASELINE_BOTTOM_FILL_COLOR1, bottomFillColor2: BASELINE_BOTTOM_FILL_COLOR2 });

const data = [{ value: 1, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922 }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722 }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922 }];

baselineSeries.setData(data);

chart.timeScale().fitContent();
```

## Candlestick

- **Method to create**: [`IChartApi.addCandlestickSeries`](/api/interfaces/IChartApi.md#addcandlestickseries)
- **Data format**: [`CandlestickData`](/api/interfaces/CandlestickData.md) or [`WhitespaceData`](/api/interfaces/WhitespaceData.md)
- **Style options**: a mix of [`SeriesOptionsCommon`](/api/interfaces/SeriesOptionsCommon.md) and [`CandlestickStyleOptions`](/api/interfaces/CandlestickStyleOptions.md)

A candlestick chart shows price movements in the form of candlesticks.
On the candlestick chart, open & close values form a solid body of a candle while wicks show high & low values for a candlestick's time interval:

```js chart replaceThemeConstants
const chartOptions = { layout: { textColor: CHART_TEXT_COLOR, background: { type: 'solid', color: CHART_BACKGROUND_COLOR } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const candlestickSeries = chart.addCandlestickSeries({ upColor: BAR_UP_COLOR, downColor: BAR_DOWN_COLOR, borderVisible: false, wickUpColor: BAR_UP_COLOR, wickDownColor: BAR_DOWN_COLOR });

const data = [{ open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 }, { open: 9.55, high: 10.30, low: 9.42, close: 9.94, time: 1642514276 }, { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 }, { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 }, { open: 9.51, high: 10.46, low: 9.10, close: 10.17, time: 1642773476 }, { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 }, { open: 10.47, high: 11.39, low: 10.40, close: 10.81, time: 1642946276 }, { open: 10.81, high: 11.60, low: 10.30, close: 10.75, time: 1643032676 }, { open: 10.75, high: 11.60, low: 10.49, close: 10.93, time: 1643119076 }, { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 }];

candlestickSeries.setData(data);

chart.timeScale().fitContent();
```

## Histogram

- **Method to create**: [`IChartApi.addHistogramSeries`](/api/interfaces/IChartApi.md#addhistogramseries)
- **Data format**: [`HistogramData`](/api/interfaces/HistogramData.md) or [`WhitespaceData`](/api/interfaces/WhitespaceData.md)
- **Style options**: a mix of [`SeriesOptionsCommon`](/api/interfaces/SeriesOptionsCommon.md) and [`HistogramStyleOptions`](/api/interfaces/HistogramStyleOptions.md)

A histogram series is a graphical representation of the value distribution.
Histogram creates intervals (columns) and counts how many values fall into each column:

```js chart replaceThemeConstants
const chartOptions = { layout: { textColor: CHART_TEXT_COLOR, background: { type: 'solid', color: CHART_BACKGROUND_COLOR } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const histogramSeries = chart.addHistogramSeries({ color: HISTOGRAM_COLOR });

const data = [{ value: 1, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922, color: 'red' }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722, color: 'red' }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922, color: 'red' }];

histogramSeries.setData(data);

chart.timeScale().fitContent();
```

## Line

- **Method to create**: [`IChartApi.addLineSeries`](/api/interfaces/IChartApi.md#addlineseries)
- **Data format**: [`LineData`](/api/interfaces/LineData.md) or [`WhitespaceData`](/api/interfaces/WhitespaceData.md)
- **Style options**: a mix of [`SeriesOptionsCommon`](/api/interfaces/SeriesOptionsCommon.md) and [`LineStyleOptions`](/api/interfaces/LineStyleOptions.md)

A line chart is a type of chart that displays information as series of the data points connected by straight line segments:

```js chart replaceThemeConstants
const chartOptions = { layout: { textColor: CHART_TEXT_COLOR, background: { type: 'solid', color: CHART_BACKGROUND_COLOR } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const lineSeries = chart.addLineSeries({ color: LINE_LINE_COLOR });

const data = [{ value: 0, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922 }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722 }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922 }];

lineSeries.setData(data);

chart.timeScale().fitContent();
```
