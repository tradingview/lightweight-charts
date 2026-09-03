# Custom series

**Custom series** let you define new types of series with your own data
structures and rendering logic. A custom series mirrors the API of the
built-in series: you add it to the chart once, then manage it with the same
methods you already use, such as
[`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) and
[`applyOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#applyoptions). For primitives
that decorate an existing series rather than define a new one, see
[Series primitives](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives.md).

## Adding a custom series

A custom series is defined by a class implementing the
[`ICustomSeriesPaneView`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneView)
interface. Pass an instance of it to the
[`addCustomSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addcustomseries) method,
then work with the returned series as with any other:

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

To remove a custom series, use the standard
[`removeSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#removeseries) method:

```javascript title='javascript'
chart.removeSeries(myCustomSeries);
```

These series are expected to have a uniform width for each data point, which
ensures that the chart maintains a consistent look and feel across all series
types. The only restriction on the data structure is that it should extend the
[`CustomData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CustomData) interface (have a valid time
property for each data point).

## Defining a custom series

The [`ICustomSeriesPaneView`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneView)
interface defines the functionality and structure required of a custom series.
It includes the following methods and properties:

### Renderer

The [`renderer`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneView#renderer) method
returns the renderer that draws the series data on the main chart pane. The
renderer must implement the
[`ICustomSeriesPaneRenderer`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneRenderer)
interface.

The library calls the renderer's
[`draw`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneRenderer#draw) method whenever
the chart needs to draw the series.

The [`PriceToCoordinateConverter`](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/PriceToCoordinateConverter)
provided as the 2nd argument to the draw method is a convenience function for
changing prices into vertical coordinate values. It is provided since the
series' original data will most likely be defined in price values, and the
renderer needs to draw with coordinates. The values returned by the converter
are in media coordinates (unscaled by `devicePixelRatio`).
See the [Canvas rendering target](https://tradingview.github.io/lightweight-charts/docs/plugins/canvas-rendering-target.md) page for more
details on the `CanvasRenderingTarget2D` provided to the `draw` method.

### Update

The [`update`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneView#update) method is
called with the latest data for the renderer to use during the next paint. It
receives two parameters: `data` (described below) and `seriesOptions`, a
reference to the currently applied options for the series.

The [`PaneRendererCustomData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PaneRendererCustomData)
interface provides the data that can be used within the renderer for drawing the
series data. It includes the following properties:

- `bars`: list of all the series' items and their x coordinates. See
  [`CustomBarItemData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CustomBarItemData) for more details
- `barSpacing`: spacing between consecutive bars.
- `visibleRange`: the current visible range of items on the chart.

### Hit testing

The renderer can implement the optional
[`hitTest`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneRenderer#hittest) method to
participate directly in hover and click resolution.

Return `null` when the cursor misses the custom geometry. Return a
[`CustomSeriesHitTestResult`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CustomSeriesHitTestResult)
when the cursor hits a custom object. The result can provide:

- `distance`: geometric distance from the cursor to the hit
- `type`: optional geometric classification such as `point`, `line`, `range`, or `custom`
- `objectId`: optional object identifier that becomes `hoveredObjectId`
- `cursorStyle`: optional cursor override
- `hitTestData`: optional renderer-defined hover data passed back into `draw`

This hook lets the custom series participate in the same geometry-first
arbitration model as built-in series.

The `type` field is used for hover arbitration only. Public mouse events still
report `hoveredInfo.type` as `custom` for custom-series hits. Use `objectId`
and `hoveredInfo.objectKind` to distinguish custom sub-objects.

### Price value builder

The
[`priceValueBuilder`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneView#pricevaluebuilder)
method interprets a data item and returns an array of numbers: the equivalent
highest, lowest, and current price values for that item.

These price values are used by the chart to determine the auto-scaling (to
ensure the items are in view) and the crosshair and price line positions. The
largest and smallest values in the array will be used to specify the visible
range of the painted item, and the last value will be used for the crosshair and
price line position.

### Whitespace

The
[`isWhitespace`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneView#iswhitespace)
method tells the library which data points should be treated as whitespace:
return `true` for a whitespace item. Whitespace data points are not passed to
the renderer or to the `priceValueBuilder`.

### Default options

The
[`defaultOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneView#defaultoptions)
property provides the default options for the series. The user can override
them with the options argument of
[`addCustomSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addcustomseries), or later
via the [`applyOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#applyoptions) method
on the series.

### Destroy

The [`destroy`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ICustomSeriesPaneView#destroy) method is
called when the series is removed from the chart. Use it to clean up
everything that could outlive the series and cause memory leaks: event
listeners, timers, and references to other objects.

---

Documentation for Lightweight Charts™ v5.2 (latest released version).

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
