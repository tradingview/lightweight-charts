---
sidebar_label: Custom Series Types
sidebar_position: 2
---

# Custom Series Types

Custom series allow developers to create new types of series with their own data
structures, and rendering logic (implemented using
[CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
methods). These custom series extend the current capabilities of our built-in
series, providing a consistent API which mirrors the built-in chart types.

:::note

These series are expected to have a uniform width for each data point, which
ensures that the chart maintains a consistent look and feel across all series
types. The only restriction on the data structure is that it should extend the
[`AbstractData`](/api/interfaces/AbstractData.md) interface (have a valid time
property for each data point).

:::

## Defining a Custom Series

A custom series should implement the
[`IAbstractSeriesPaneView`](/api/interfaces/IAbstractSeriesPaneView.md)
interface. The interface defines the basic functionality and structure required
for creating a custom series view.

It includes the following methods and properties:

### [`renderer`](/api/interfaces/IAbstractSeriesPaneView.md#renderer)

This method should return a renderer which implements the
[`IAbstractSeriesPaneRenderer`](/api/interfaces/IAbstractSeriesPaneRenderer.md)
interface and is used to draw the series data on the main chart pane.

The [`draw`](/api/interfaces/IAbstractSeriesPaneRenderer.md#draw) method of the
renderer is evoked whenever the chart needs to draw the series.

The [`PriceToCoordinateConverter`](/api/index.md#pricetocoordinateconverter) provided as
the 2nd argument to the draw method is a convenience function for changing
prices into vertical coordinate values. It is provided since the series'
original data will most likely be defined in price values, and the renderer
needs to draw with coordinates.

### [`update`](/api/interfaces/IAbstractSeriesPaneView.md#update)

This method will be called with the latest data for the renderer to use during
the next paint.

The update method is evoked with two parameters: `data` (discussed below), and
`seriesOptions`. seriesOptions is a reference to the currently applied options
for the series

The [`PaneRendererAbstractData`](/api/interfaces/PaneRendererAbstractData.md)
interface provides the data that can be used within the renderer for drawing the
series data. It includes the following properties:

- `bars`: List of all the series' items and their x coordinates. See
  [`AbstractBarItemData`](/api/interfaces/AbstractBarItemData.md) for more
  details
- `barSpacing`: Spacing between consecutive bars.
- `visibleRange`: The current visible range of items on the chart.

### [`priceValueBuilder`](/api/interfaces/IAbstractSeriesPaneView.md#priceValueBuilder)

A function for interpreting the custom series data and returning an array of
numbers representing the open, high, low, close values for the item.

These OHLC values are used by the chart to determine the auto-scaling (to ensure
the items are in view) and the crosshair and price line positions. Use the high
and low values to specify the visible range of the painted item, and the close
value for the crosshair and price line position.

### [`defaultOptions`](/api/interfaces/IAbstractSeriesPaneView.md#defaultoptions)

The default options to be used for the series. The user can override these
values using the options argument in
[`addAbstractSeries`](/api/interfaces/IChartApi.md#addabstractseries), or via
the [`applyOptions`](/api/interfaces/ISeriesApi.md#applyoptions) method on the
`ISeriesAPI`.

### [`destroy`](/api/interfaces/IAbstractSeriesPaneView.md#destroy)

This method will be evoked when the series has been removed from the chart. This
method should be used to clean up any objects, references, and other items that
could potentially cause memory leaks.

This method should contain all the necessary code to clean up the object before
it is removed from memory. This includes removing any event listeners or timers
that are attached to the object, removing any references to other objects, and
resetting any values or properties that were modified during the lifetime of the
object.
