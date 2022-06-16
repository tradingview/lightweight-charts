---
slug: /
id: intro
sidebar_position: 0
---

# Getting started

## Requirements

First of all, Lightweight Charts is _a client-side_ library.
This means that it does not and cannot work on the server-side (i.e. NodeJS), at least out of the box.

The code of `lightweight-charts` package is targeted to [_es2016_ language specification](https://262.ecma-international.org/7.0/).
Thus, all the browsers you will have to work with should support this language revision (see [this compatibility table](https://kangax.github.io/compat-table/es2016plus/)).
If you need to support the previous revisions, you could try to setup a transpilation of the package to the target you need to support in your build system (e.g. by using Babel).
If you'll have any issues with that, please raise an issue on github with the details and we'll investigate possible ways to solve it.

## Installation

The first thing you need to do to use `lightweight-charts` is to install it from [npm](https://www.npmjs.com/):

```console
npm install --save lightweight-charts
```

_Note that the package is shipped with TypeScript declarations, so you can easily use it within TypeScript code._

## Creating a chart

Once the library has been installed in your repo you're ready to create your first chart.

First of all, in a file where you would like to create a chart you need to import the library:

```js
import { createChart } from 'lightweight-charts';
```

[`createChart`](/api/index.md#createchart) is the entry-point for creating charts. You can use it to create as many charts as you need:

```js
import { createChart } from 'lightweight-charts';

// ...

// somewhere in your code
const firstChart = createChart(document.getElementById('firstContainer'));
const secondChart = createChart(document.getElementById('secondContainer'));
```

The result of this function is a [`IChartApi`](/api/interfaces/IChartApi.md) object, which you need to use to work with a chart instance.

## Creating a series

Once your chart is created it is ready to display data.

The basic primitive to display a data is [a series](/api/interfaces/ISeriesApi.md).
There are different types of series:

- Area
- Bar
- Baseline
- Candlestick
- Histogram
- Line

To create a series with desired type you need to use appropriate method from [`IChartApi`](/api/interfaces/IChartApi.md).
All of them have the same naming `add<type>Series`, where `<type>` is a type of a series you'd like to create:

```js
import { createChart } from 'lightweight-charts';

const chart = createChart(container);

const areaSeries = chart.addAreaSeries();
const barSeries = chart.addBarSeries();
const baselineSeries = chart.addBaselineSeries();
// ... and so on
```

Please look at [this page](/series-types.md) for more information about different series types.

Note that **a series cannot be transferred from one type to another one** since different series types have different data and options types.

## Setting and updating a data

Once your chart and series are created it's time to set data to the series.

Note that regardless of the series type, the API calls are the same (the type of the data might be different though).

### Setting the data to a series

To set the data (or to replace all data items) to a series you need to use [`ISeriesApi.setData`](/api/interfaces/ISeriesApi.md#setdata) method:

```js chart replaceThemeConstants
const chartOptions = { layout: { textColor: CHART_TEXT_COLOR, background: { type: 'solid', color: CHART_BACKGROUND_COLOR } } };
const chart = createChart(document.getElementById('container'), chartOptions);
const areaSeries = chart.addAreaSeries({
    lineColor: LINE_LINE_COLOR, topColor: AREA_TOP_COLOR,
    bottomColor: AREA_BOTTOM_COLOR,
});
areaSeries.setData([
    { time: '2018-12-22', value: 32.51 },
    { time: '2018-12-23', value: 31.11 },
    { time: '2018-12-24', value: 27.02 },
    { time: '2018-12-25', value: 27.32 },
    { time: '2018-12-26', value: 25.17 },
    { time: '2018-12-27', value: 28.89 },
    { time: '2018-12-28', value: 25.46 },
    { time: '2018-12-29', value: 23.92 },
    { time: '2018-12-30', value: 22.68 },
    { time: '2018-12-31', value: 22.67 },
]);

const candlestickSeries = chart.addCandlestickSeries({
    upColor: BAR_UP_COLOR, downColor: BAR_DOWN_COLOR, borderVisible: false,
    wickUpColor: BAR_UP_COLOR, wickDownColor: BAR_DOWN_COLOR,
});
candlestickSeries.setData([
    { time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
    { time: '2018-12-23', open: 45.12, high: 53.90, low: 45.12, close: 48.09 },
    { time: '2018-12-24', open: 60.71, high: 60.71, low: 53.39, close: 59.29 },
    { time: '2018-12-25', open: 68.26, high: 68.26, low: 59.04, close: 60.50 },
    { time: '2018-12-26', open: 67.71, high: 105.85, low: 66.67, close: 91.04 },
    { time: '2018-12-27', open: 91.04, high: 121.40, low: 82.70, close: 111.40 },
    { time: '2018-12-28', open: 111.51, high: 142.83, low: 103.34, close: 131.25 },
    { time: '2018-12-29', open: 131.33, high: 151.17, low: 77.68, close: 96.43 },
    { time: '2018-12-30', open: 106.33, high: 110.20, low: 90.39, close: 98.10 },
    { time: '2018-12-31', open: 109.87, high: 114.69, low: 85.66, close: 111.26 },
]);

chart.timeScale().fitContent();
```

### Updating the data in a series

In a case when your data is updated (e.g. real-time updates) you might want to update the chart as well.

But using [`ISeriesApi.setData`](/api/interfaces/ISeriesApi.md#setdata) very often might affect the performance and we do not recommend to do this.
Also it replaces all series data with the new one, and probably this is not what you're looking for.

Thus, to update the data you can use a method [`ISeriesApi.update`](/api/interfaces/ISeriesApi.md#update).
It allows you to update the last data item or add a new one much faster without affecting the performance:

```js
import { createChart } from 'lightweight-charts';

const chart = createChart(container);

const areaSeries = chart.addAreaSeries();
areaSeries.setData([
    // ... other data items
    { time: '2018-12-31', value: 22.67 },
]);

const candlestickSeries = chart.addCandlestickSeries();
candlestickSeries.setData([
    // ... other data items
    { time: '2018-12-31', open: 109.87, high: 114.69, low: 85.66, close: 111.26 },
]);

// sometime later

// update the most recent bar
areaSeries.update({ time: '2018-12-31', value: 25 });
candlestickSeries.update({ time: '2018-12-31', open: 109.87, high: 114.69, low: 85.66, close: 112 });

// creating the new bar
areaSeries.update({ time: '2019-01-01', value: 20 });
candlestickSeries.update({ time: '2019-01-01', open: 112, high: 112, low: 100, close: 101 });
```
