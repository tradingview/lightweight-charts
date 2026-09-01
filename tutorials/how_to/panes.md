# Panes

Lightweight Charts™ allows you to create multiple [panes](https://tradingview.github.io/lightweight-charts/docs/next/panes) in a single chart.

Using multiple panes in a charting library can be incredibly useful for a variety of analytical and visualization scenarios,
especially when dealing with complex datasets or requiring detailed comparative analysis across different data dimensions.

This example shows how to use panes in Lightweight Charts™. We will create a chart with two panes: the first one will display a stock's price over time and the second one will contain trading volume. The price and volume will be represented with candles and an area, respectively.

You can see a full [working example](#full-example) below.

## How to add a pane

To introduce an additional pane into a chart, specify `paneIndex` during series creation.

Alternatively, you can invoke the [`moveToPane`](https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/ISeriesApi#movetopane) method on the series instance. Note that if the pane with specified index doesn't exist, it will be created.

```js
const volumeSeries = chart.addSeries(
    HistogramSeries,
    {
        priceFormat: {
            type: 'volume',
        },
    },
    1 // Pane index
);
// Moving the series to a different pane
volumeSeries.moveToPane(2);
```

If a series is moved out of a pane and no other series remain, the pane will be automatically removed.

### Customizations

Lightweight Charts™ provides options to customize the panes. You can adjust the pane separator color by specifying the `separatorColor` property in the
[`layout.panes`](https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/LayoutPanesOptions) chart options, and use `separatorHoverColor` to change the separator color on hover.

```js
chart.applyOptions({
    layout: {
        panes: {
            separatorColor: '#ff0000',
            separatorHoverColor: '#00ff00',
            enableResize: false,
        },
    },
});
```

Lightweight Charts™ includes  [`PaneApi`](https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/IPaneApi) that allows you to control each pane. The API has methods to get information on the pane such as `getHeight()`, `paneIndex()`, and `getSeries()`. It also contains methods to adjust the pane parameters, for example `setHeight(height)` and `moveTo(paneIndex)`.

To get a `PaneApi` instance for each pane, you need to call the `panes` method on the `ChartApi` instance.
Let's say we want to set the height of the second pane to 300px and move it to the first position.

```js
const secondPane = chart.panes()[1];
secondPane.setHeight(300);
secondPane.moveTo(0);
```

Note that the minimum pane height is 30px. Any values lower than 30px will be ignored.

To remove the pane, you can call the `removePane(paneIndex)` method on the `ChartApi` instance.

```js
chart.removePane(1);
```

Note that removing a pane also removes any series contained within it.

## Full Example

**How to use the code sample**

Before you use the code sample below, you should do the following::
-  Import `createChart`. Refer to [Getting Started](https://tradingview.github.io/lightweight-charts/docs.md#creating-a-chart) for more information.
-  Add an HTML div element with the `id` of the `container`.

Here is an example skeleton setup: [Code Sandbox](https://codesandbox.io/s/lightweight-charts-skeleton-n67pm6).
You can paste the provided code below the `// REPLACE EVERYTHING BELOW HERE` comment.

:::tip

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

:::

```js
const chartOptions = {
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
		panes: {
			separatorColor: '#f22c3d',
			separatorHoverColor: 'rgba(255, 0, 0, 0.1)',
			// setting this to false will disable the resize of the panes by the user
			enableResize: false,
		},
	},
};
const chart = createChart(document.getElementById('container'), chartOptions);

const areaSeries = chart.addSeries(AreaSeries, {
	topColor: '#2962FF',
	bottomColor: 'rgba(41, 98, 255, 0.28)',
	lineColor: '#2962FF',
	lineWidth: 2,
});

const candlestickSeries = chart.addSeries(CandlestickSeries, {
	upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
	wickUpColor: '#26a69a', wickDownColor: '#ef5350',
	// we are setting pane index 1 for this series
}, 1);

areaSeries.setData([
	{ time: '2018-10-19', value: 52.89 },
	{ time: '2018-10-22', value: 55.22 },
	{ time: '2018-10-23', value: 57.21 },
	{ time: '2018-10-24', value: 57.42 },
	{ time: '2018-10-25', value: 56.43 },
	{ time: '2018-10-26', value: 55.51 },
	{ time: '2018-10-29', value: 56.48 },
	{ time: '2018-10-30', value: 58.18 },
	{ time: '2018-10-31', value: 57.09 },
	{ time: '2018-11-01', value: 56.05 },
	{ time: '2018-11-02', value: 56.63 },
	{ time: '2018-11-05', value: 57.21 },
	{ time: '2018-11-06', value: 57.21 },
	{ time: '2018-11-07', value: 57.65 },
	{ time: '2018-11-08', value: 58.27 },
	{ time: '2018-11-09', value: 58.46 },
	{ time: '2018-11-12', value: 58.72 },
	{ time: '2018-11-13', value: 58.66 },
	{ time: '2018-11-14', value: 58.94 },
	{ time: '2018-11-15', value: 59.08 },
	{ time: '2018-11-16', value: 60.21 },
	{ time: '2018-11-19', value: 60.62 },
	{ time: '2018-11-20', value: 59.46 },
	{ time: '2018-11-21', value: 59.16 },
	{ time: '2018-11-23', value: 58.64 },
	{ time: '2018-11-26', value: 59.17 },
	{ time: '2018-11-27', value: 60.65 },
	{ time: '2018-11-28', value: 60.06 },
	{ time: '2018-11-29', value: 59.45 },
	{ time: '2018-11-30', value: 60.30 },
	{ time: '2018-12-03', value: 58.16 },
	{ time: '2018-12-04', value: 58.09 },
	{ time: '2018-12-06', value: 58.08 },
	{ time: '2018-12-07', value: 57.68 },
	{ time: '2018-12-10', value: 58.27 },
	{ time: '2018-12-11', value: 58.85 },
	{ time: '2018-12-12', value: 57.25 },
	{ time: '2018-12-13', value: 57.09 },
	{ time: '2018-12-14', value: 57.08 },
	{ time: '2018-12-17', value: 55.95 },
	{ time: '2018-12-18', value: 55.65 },
	{ time: '2018-12-19', value: 55.86 },
	{ time: '2018-12-20', value: 55.07 },
	{ time: '2018-12-21', value: 54.92 },
	{ time: '2018-12-24', value: 53.05 },
]);

// setting the data for the volume series.
// note: we are defining each bars color as part of the data
candlestickSeries.setData([
	{ time: '2018-10-19', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
	{ time: '2018-10-22', open: 72.16, high: 80.32, low: 32.18, close: 42.12 },
	{ time: '2018-10-23', open: 45.12, high: 53.90, low: 45.12, close: 48.09 },
	{ time: '2018-10-24', open: 60.71, high: 60.71, low: 53.39, close: 59.29 },
	{ time: '2018-10-25', open: 68.26, high: 68.26, low: 59.04, close: 60.50 },
	{ time: '2018-10-26', open: 67.71, high: 105.85, low: 66.67, close: 91.04 },
	{ time: '2018-10-29', open: 91.04, high: 121.40, low: 82.70, close: 111.40 },
	{ time: '2018-10-30', open: 111.51, high: 142.83, low: 103.34, close: 131.25 },
	{ time: '2018-10-31', open: 131.33, high: 151.17, low: 77.68, close: 96.43 },
	{ time: '2018-11-01', open: 106.33, high: 110.20, low: 90.39, close: 98.10 },
	{ time: '2018-11-02', open: 109.87, high: 114.69, low: 85.66, close: 111.26 },
	{ time: '2018-11-05', open: 56.02, high: 56.02, low: 56.02, close: 56.02 },
	{ time: '2018-11-06', open: 106.33, high: 110.20, low: 90.39, close: 98.10 },
	{ time: '2018-11-07', open: 109.87, high: 114.69, low: 85.66, close: 111.26 },
	{ time: '2018-11-09', open: 58.46, high: 53.90, low: 32.18, close: 42.12 },
	{ time: '2018-11-12', open: 45.12, high: 60.71, low: 45.12, close: 48.09 },
	{ time: '2018-11-13', open: 60.71, high: 68.26, low: 53.39, close: 59.29 },
	{ time: '2018-11-14', open: 68.26, high: 105.85, low: 59.04, close: 60.50 },
	{ time: '2018-11-15', open: 67.71, high: 121.40, low: 66.67, close: 91.04 },
	{ time: '2018-11-16', open: 91.04, high: 142.83, low: 82.70, close: 111.40 },
	{ time: '2018-11-19', open: 111.51, high: 151.17, low: 103.34, close: 131.25 },
	{ time: '2018-11-20', open: 131.33, high: 110.20, low: 77.68, close: 96.43 },
	{ time: '2018-11-21', open: 106.33, high: 114.69, low: 90.39, close: 98.10 },
	{ time: '2018-11-23', open: 109.87, high: 56.02, low: 85.66, close: 111.26 },
	{ time: '2018-11-26', open: 59.17, high: 58.46, low: 56.02, close: 56.02 },
	{ time: '2018-11-27', open: 60.65, high: 58.46, low: 90.39, close: 98.10 },
	{ time: '2018-11-28', open: 60.06, high: 58.46, low: 85.66, close: 111.26 },
	{ time: '2018-11-29', open: 59.45, high: 58.46, low: 58.46, close: 58.46 },
	{ time: '2018-11-30', open: 60.30, high: 58.46, low: 58.46, close: 58.46 },
	{ time: '2018-12-03', open: 72.16, high: 80.32, low: 32.18, close: 42.12 },
	{ time: '2018-12-04', open: 45.12, high: 53.90, low: 45.12, close: 48.09 },
	{ time: '2018-12-06', open: 60.71, high: 60.71, low: 53.39, close: 59.29 },
	{ time: '2018-12-07', open: 68.26, high: 68.26, low: 59.04, close: 60.50 },
	{ time: '2018-12-10', open: 67.71, high: 105.85, low: 66.67, close: 91.04 },
	{ time: '2018-12-11', open: 91.04, high: 121.40, low: 82.70, close: 111.40 },
	{ time: '2018-12-12', open: 111.51, high: 142.83, low: 103.34, close: 131.25 },
	{ time: '2018-12-13', open: 131.33, high: 151.17, low: 77.68, close: 96.43 },
	{ time: '2018-12-14', open: 106.33, high: 110.20, low: 90.39, close: 98.10 },
	{ time: '2018-12-17', open: 109.87, high: 114.69, low: 85.66, close: 111.26 },
	{ time: '2018-12-18', open: 56.02, high: 56.02, low: 56.02, close: 56.02 },
	{ time: '2018-12-19', open: 106.33, high: 110.20, low: 90.39, close: 98.10 },
	{ time: '2018-12-20', open: 109.87, high: 114.69, low: 85.66, close: 111.26 },
	{ time: '2018-12-21', open: 58.46, high: 53.90, low: 32.18, close: 42.12 },
	{ time: '2018-12-24', open: 45.12, high: 60.71, low: 45.12, close: 48.09 },
]);
const candlesPane = chart.panes()[1];
candlesPane.moveTo(0);
candlesPane.setHeight(150);
chart.timeScale().fitContent();
```

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
