---
sidebar_label: Introduction
sidebar_position: 0
---

# Plugins Introduction

The library provides a rich set of charting capabilities out of the box, but
developers can also extend its functionality by building custom plugins.

Plugins in Lightweight Charts™️ come in two types: [custom series](#custom-series)
and [drawing primitives](#drawing-primitives). Custom series allow developers to
define new types of series, while drawing primitives enable the creation of
custom visualizations, drawing tools, and chart annotations (and more) which can
be attached to an existing series.

:::tip Picking between the Custom Series and Drawing Primitives

In the majority of cases you will most likely be better served by using a [Drawing Primitive](#drawing-primitives) plugin unless you are specifically looking to create a new type of series

:::

With the flexibility provided by these plugins, developers can create highly
customizable charting applications for their users.

:::info

Examples of plugins can be found on the following repository:
[Lightweight Charts™️ Plugin Examples](https://github.com/tradingview/lightweight-charts-plugin-examples)

:::

## Custom Series

Custom series allow developers to create new types of series with their own data
structures, and rendering logic (implemented using
[CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
methods). These custom series extend the current capabilities of our built-in series,
providing a consistent API which mirrors the built-in chart types. These series
are expected to have a uniform width for each data point, which ensures that the
chart maintains a consistent look and feel across all series types. The only
restriction on the data structure is that it should extend the WhitespaceData
interface (have a valid time property for each data point).

**You can find a more detailed guide to developing custom series in the
[Custom Series Types](./custom_series/) article.**

### Adding a custom series to a chart

A custom series can be added to a chart using the
[`addAbstractSeries`](/api/interfaces/IChartApi.md#addabstractseries) method
which expects a class implementing the
[IAbstractSeriesPaneView](/api/interfaces/IAbstractSeriesPaneView.md) interface
as the first argument, and an optional set of options as the second argument.
The series can then be used just like any other series, for example you would
use `setData` method to provide data to the series.

```javascript
class MyCustomSeries {
    /* Class implementing the IAbstractSeriesPaneView interface */
}

const chart = createChart(document.getElementById('container'));
const myCustomSeries = chart.addAbstractSeries(MyCustomSeries, {
    // options for the MyCustomSeries
    customOption: 10,
});

const data = [
    { time: 1642425322, value: 123, customValue: 456 },
    /* ... more data */
];

myCustomSeries.setData(data);
```

## Drawing Primitives

Drawing primitives provide a more flexible approach to extending the charting
capabilities of Lightweight Charts™️. They are attached to a specific series and
can draw anywhere on the chart, including the main chart pane, price scales, and
time scales.

Primitives can be used to create custom drawing tools or indicators, or to add
entirely new visualizations to the chart. Primitives can be drawn at different
levels in the visual stack, allowing for complex compositions of multiple
primitives.

**You can find a more detailed guide to developing series primitives in the
[Series Primitives](./series-primitives/) article.**

### Adding a primitive to an existing series

A custom series primitive can be added to an existing series using the
[`attachPrimitive()`](/api/interfaces/ISeriesApi.md#attachprimitive) method which
expects a instantiated object implementing the
[ISeriesPrimitive](/api/interfaces/ISeriesPrimitive.md) interface as the first
argument.

```javascript
class MyCustomPrimitive {
    /* Class implementing the ISeriesPrimitive interface */
}

// Create an instantiated series primitive.
const myCustomPrimitive = new MyCustomPrimitive();

const chart = createChart(document.getElementById('container'));
const lineSeries = chart.addLineSeries();

const data = [
    { time: 1642425322, value: 123 },
    /* ... more data */
];

// Attach the primitive to the series
lineSeries.attachPrimitive(myCustomPrimitive);
```
