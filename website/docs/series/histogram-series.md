# Histogram Series

A histogram series is a graphical representation of the value distribution.

Histogram creates intervals (columns) and counts how many values fall into each column.

![Histogram example](/img/histogram-series.png "Histogram chart example")

## How to create histogram series

```js
const histogramSeries = chart.addHistogramSeries({
    base: 0,
});

// set the data
histogramSeries.setData([
    { time: '2018-12-20', value: 20.31, color: '#ff00ff' },
    { time: '2018-12-21', value: 30.27, color: '#ff00ff' },
    { time: '2018-12-22', value: 70.28, color: '#ff00ff' },
    { time: '2018-12-23', value: 49.29, color: '#ff0000' },
    { time: '2018-12-24', value: 40.64, color: '#ff0000' },
    { time: '2018-12-25', value: 57.46, color: '#ff0000' },
    { time: '2018-12-26', value: 50.55, color: '#0000ff' },
    { time: '2018-12-27', value: 34.85, color: '#0000ff' },
    { time: '2018-12-28', value: 56.68, color: '#0000ff' },
    { time: '2018-12-29', value: 51.60, color: '#00ff00' },
    { time: '2018-12-30', value: 75.33, color: '#00ff00' },
    { time: '2018-12-31', value: 54.85, color: '#00ff00' },
]);
```

## Data format

Each item of the histogram series should be a [HistogramData](/api/interfaces/HistogramData.md) or a [whitespace](/api/interfaces/WhitespaceData.md) item.

## Customization

A histogram series interface can be customized using the following options: [HistogramStyleOptions](/api/interfaces/HistogramStyleOptions).
