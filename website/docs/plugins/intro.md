---
sidebar_label: Overview
sidebar_position: 0
---

# Plugins

Plugins allow you to extend the library's functionality and render custom elements, such as new series, drawing tools, indicators, and watermarks.

You can create plugins of the following types:

- [Custom series](#custom-series) — define new types of series.
- [Primitives](#primitives) — define custom visualizations, drawing tools, and
chart annotations that can be attached to an existing series ([series primitives](#series-primitives)) or chart pane ([pane primitives](#pane-primitives)).

:::tip[Tips]

- Use the [create-lwc-plugin](https://www.npmjs.com/package/create-lwc-plugin) npm package to quickly scaffold a project for your custom plugin.
- Explore the [Plugin Examples Demo](https://tradingview.github.io/lightweight-charts/plugin-examples) page that hosts interactive examples of heatmaps, alerts, watermarks, and tooltips implemented with plugins. You can find the code of these examples in the [`plugin-examples`](https://github.com/tradingview/lightweight-charts/tree/master/plugin-examples) folder in the Lightweight Charts™ repository.

:::

## Custom series

Custom series allow you to define new types of series with custom data structures and rendering logic.
For implementation details, refer to the [Custom Series Types](./custom_series.md) article.

Use the [`addCustomSeries`](../api/interfaces/IChartApi.md#addcustomseries) method to add a custom series to the chart.
Then, you can manage it through the same API available for built-in series.
For example, call the [`setData`](../api/interfaces/ISeriesApi.md#setdata) method to populate the series with data.

```javascript title='javascript'
class MyCustomSeries {
    /* Class implementing the ICustomSeriesPaneView interface */
}

// Create an instantiated custom series
const customSeriesInstance = new MyCustomSeries();

const chart = createChart(document.getElementById('container'));
const myCustomSeries = chart.addCustomSeries(customSeriesInstance, {
    // Options for MyCustomSeries
    customOption: 10,
});

const data = [
    { time: 1642425322, value: 123, customValue: 456 },
    /* ... more data */
];

myCustomSeries.setData(data);
```

## Primitives

Primitives allow you to define custom visualizations, drawing tools, and chart annotations. You can render them at different
levels in the visual stack to create complex, layered compositions.

### Series primitives

Series primitives are attached to a specific series and can render on the main pane, price and
time scales. For implementation details, refer to the [Series Primitives](./series-primitives.mdx) article.

Use the [`attachPrimitive`](../api/interfaces/ISeriesApi.md#attachprimitive) method to add a primitive to the chart and attach it to the series.

```javascript title='javascript'
class MyCustomPrimitive {
    /* Class implementing the ISeriesPrimitive interface */
}

// Create an instantiated series primitive
const myCustomPrimitive = new MyCustomPrimitive();

const chart = createChart(document.getElementById('container'));
const lineSeries = chart.addSeries(LineSeries);

const data = [
    { time: 1642425322, value: 123 },
    /* ... more data */
];

// Attach the primitive to the series
lineSeries.attachPrimitive(myCustomPrimitive);
```

### Pane primitives

Pane primitives are attached to a chart pane rather than a specific series. You can use them to create chart-wide annotations and features like watermarks.
For implementation details, refer to the [Pane Primitives](./pane-primitives.md) article.

:::caution

Note that pane primitives cannot render on the price or time scale.

:::

Use the [`attachPrimitive`](../api/interfaces/IPaneApi.md#attachprimitive) method to add a primitive to the chart and attach it to the pane.

```javascript
class MyCustomPanePrimitive {
    /* Class implementing the IPanePrimitive interface */
}

// Create an instantiated pane primitive
const myCustomPanePrimitive = new MyCustomPanePrimitive();

const chart = createChart(document.getElementById('container'));
// Get the main pane
const mainPane = chart.panes()[0];

// Attach the primitive to the pane
mainPane.attachPrimitive(myCustomPanePrimitive);
```
