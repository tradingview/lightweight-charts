# Series

This article describes supported series types and ways to [customize](#customization) them.

## Supported types

### Area

- **Series Definition**: [`AreaSeries`](https://tradingview.github.io/lightweight-charts/docs/api/variables/AreaSeries)
- **Data format**: [`SingleValueData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SingleValueData) or [`WhitespaceData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/WhitespaceData)
- **Style options**: a mix of [`SeriesOptionsCommon`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon) and [`AreaStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/AreaStyleOptions)

This series is represented with a colored area between the [time scale](https://tradingview.github.io/lightweight-charts/docs/time-scale.md) and line connecting all data points:

```js
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const areaSeries = chart.addSeries(AreaSeries, { lineColor: '#2962FF', topColor: '#2962FF', bottomColor: 'rgba(41, 98, 255, 0.28)' });

const data = [{ value: 0, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922 }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722 }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922 }];

areaSeries.setData(data);

chart.timeScale().fitContent();
```

### Bar

- **Series Definition**: [`BarSeries`](https://tradingview.github.io/lightweight-charts/docs/api/variables/BarSeries)
- **Data format**: [`BarData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BarData) or [`WhitespaceData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/WhitespaceData)
- **Style options**: a mix of [`SeriesOptionsCommon`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon) and [`BarStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BarStyleOptions)

This series illustrates price movements with vertical bars.
The length of each bar corresponds to the range between the highest and lowest price values.
Open and close values are represented with the tick marks on the left and right side of the bar, respectively:

```js
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const barSeries = chart.addSeries(BarSeries, { upColor: '#26a69a', downColor: '#ef5350' });

const data = [
  { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },
  { open: 9.55, high: 10.30, low: 9.42, close: 9.94, time: 1642514276 },
  { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 },
  { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 },
  { open: 9.51, high: 10.46, low: 9.10, close: 10.17, time: 1642773476 },
  { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 },
  { open: 10.47, high: 11.39, low: 10.40, close: 10.81, time: 1642946276 },
  { open: 10.81, high: 11.60, low: 10.30, close: 10.75, time: 1643032676 },
  { open: 10.75, high: 11.60, low: 10.49, close: 10.93, time: 1643119076 },
  { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 },
  { open: 10.96, high: 11.90, low: 10.80, close: 11.50, time: 1643291876 },
  { open: 11.50, high: 12.00, low: 11.30, close: 11.80, time: 1643378276 },
  { open: 11.80, high: 12.20, low: 11.70, close: 12.00, time: 1643464676 },
  { open: 12.00, high: 12.50, low: 11.90, close: 12.30, time: 1643551076 },
  { open: 12.30, high: 12.80, low: 12.10, close: 12.60, time: 1643637476 },
  { open: 12.60, high: 13.00, low: 12.50, close: 12.90, time: 1643723876 },
  { open: 12.90, high: 13.50, low: 12.70, close: 13.20, time: 1643810276 },
  { open: 13.20, high: 13.70, low: 13.00, close: 13.50, time: 1643896676 },
  { open: 13.50, high: 14.00, low: 13.30, close: 13.80, time: 1643983076 },
  { open: 13.80, high: 14.20, low: 13.60, close: 14.00, time: 1644069476 },
];

barSeries.setData(data);

chart.timeScale().fitContent();
```

### Baseline

- **Series Definition**: [`BaselineSeries`](https://tradingview.github.io/lightweight-charts/docs/api/variables/BaselineSeries)
- **Data format**: [`SingleValueData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SingleValueData) or [`WhitespaceData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/WhitespaceData)
- **Style options**: a mix of [`SeriesOptionsCommon`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon) and [`BaselineStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BaselineStyleOptions)

This series is represented with two colored areas between the [the base value line](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/BaselineStyleOptions#basevalue) and line connecting all data points:

```js
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const baselineSeries = chart.addSeries(BaselineSeries, { baseValue: { type: 'price', price: 25 }, topLineColor: 'rgba( 38, 166, 154, 1)', topFillColor1: 'rgba( 38, 166, 154, 0.28)', topFillColor2: 'rgba( 38, 166, 154, 0.05)', bottomLineColor: 'rgba( 239, 83, 80, 1)', bottomFillColor1: 'rgba( 239, 83, 80, 0.05)', bottomFillColor2: 'rgba( 239, 83, 80, 0.28)' });

const data = [{ value: 1, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922 }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722 }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922 }];

baselineSeries.setData(data);

chart.timeScale().fitContent();
```

### Candlestick

- **Series Definition**: [`CandlestickSeries`](https://tradingview.github.io/lightweight-charts/docs/api/variables/CandlestickSeries)
- **Data format**: [`CandlestickData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CandlestickData) or [`WhitespaceData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/WhitespaceData)
- **Style options**: a mix of [`SeriesOptionsCommon`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon) and [`CandlestickStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CandlestickStyleOptions)

This series illustrates price movements with candlesticks.
The solid body of each candlestick represents the open and close values for the time period. Vertical lines, known as wicks, above and below the candle body represent the high and low values, respectively:

```js
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const candlestickSeries = chart.addSeries(CandlestickSeries, { upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });

const data = [{ open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 }, { open: 9.55, high: 10.30, low: 9.42, close: 9.94, time: 1642514276 }, { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 }, { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 }, { open: 9.51, high: 10.46, low: 9.10, close: 10.17, time: 1642773476 }, { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 }, { open: 10.47, high: 11.39, low: 10.40, close: 10.81, time: 1642946276 }, { open: 10.81, high: 11.60, low: 10.30, close: 10.75, time: 1643032676 }, { open: 10.75, high: 11.60, low: 10.49, close: 10.93, time: 1643119076 }, { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 }];

candlestickSeries.setData(data);

chart.timeScale().fitContent();
```

### Histogram

- **Series Definition**: [`HistogramSeries`](https://tradingview.github.io/lightweight-charts/docs/api/variables/HistogramSeries)
- **Data format**: [`HistogramData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/HistogramData) or [`WhitespaceData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/WhitespaceData)
- **Style options**: a mix of [`SeriesOptionsCommon`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon) and [`HistogramStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/HistogramStyleOptions)

This series illustrates the distribution of values with columns:

```js
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const histogramSeries = chart.addSeries(HistogramSeries, { color: '#26a69a' });

const data = [{ value: 1, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922, color: 'red' }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722, color: 'red' }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922, color: 'red' }];

histogramSeries.setData(data);

chart.timeScale().fitContent();
```

### Line

- **Series Definition**: [`LineSeries`](https://tradingview.github.io/lightweight-charts/docs/api/variables/LineSeries)
- **Data format**: [`LineData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LineData) or [`WhitespaceData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/WhitespaceData)
- **Style options**: a mix of [`SeriesOptionsCommon`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon) and [`LineStyleOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LineStyleOptions)

This series is represented with a set of data points connected by straight line segments:

```js
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const lineSeries = chart.addSeries(LineSeries, { color: '#2962FF' });

const data = [{ value: 0, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922 }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722 }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922 }];

lineSeries.setData(data);

chart.timeScale().fitContent();
```

### Custom series (plugins)

The library enables you to create custom series types, also known as series plugins, to expand its functionality. With this feature, you can add new series types, indicators, and other visualizations.

To define a custom series type, create a class that implements the [`ICustomSeriesPaneView`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneView) interface. This class defines the rendering code that Lightweight Charts&trade; uses to draw the series on the chart.
Once your custom series type is defined, it can be added to any chart instance using the [`addCustomSeries()`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addcustomseries) method. Custom series types function like any other series.

For more information, refer to the [Plugin development](https://tradingview.github.io/lightweight-charts/docs/plugins/intro.md) section.

## Customization

Each series type offers a unique set of customization options listed on the [`SeriesStyleOptionsMap`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesStyleOptionsMap) page.

You can adjust series options in two ways:

- Specify the default options using the corresponding parameter while creating a series:

    ```js
    // Change default top & bottom colors of an area series in creating time
    const series = chart.addSeries(AreaSeries, {
        topColor: 'red',
        bottomColor: 'green',
    });
    ````

- Use the [`ISeriesApi.applyOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#applyoptions) method to apply other options on the fly:

    ```js
    // Updating candlestick series options on the fly
    candlestickSeries.applyOptions({
        upColor: 'red',
        downColor: 'blue',
    });
    ```

---

Documentation for Lightweight Charts™ v5.2 (latest released version).

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
