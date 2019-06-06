# Series basics

Each series has a set of common properties and methods regardless of its type.

For example, to create any type of series you can pass the `title` parameter to set series title.

These "common" parameters and API is described here. If you want to see an API for a specific type of series - see relevant doc page.

## Creating a series

To create any type of series you need to call the `chart.add<type>Series` method where `<type>` is a type of series you want to add to the chart.

For example:

- to create line series:

    ```javascript
    const lineSeries = chart.addLineSeries();
    ```

- to create area series:

    ```javascript
    const areaSeries = chart.addAreaSeries();
    ```

- to create bar series:

    ```javascript
    const barSeries = chart.addBarSeries();
    ```

## Parameters

When you create the series you can specify parameters of series you want to change.

Here are common parameters for every series:

|Name|Type|Default|Description|
|-|----|-------|-|
|`overlay`|`boolean`|`false`|Whether or not series should be an overlay|
|`title`|`string` | `undefined`|`rgba(40, 221, 100, 0)`|You can name series when adding it to a chart. This name will be displayed on the label next to the last value label|
|`scaleMargins`|`{ top, bottom }` | `undefined`|`undefined`|[Margins](#margins) of the _overlay_ series|

Example:

```javascript
const lineSeries = chart.addLineSeries({
    overlay: true,
    title: 'Series title example',
    scaleMargins: {
        top: 0.1,
        bottom: 0.3,
    },
});
```

### Overlay

When adding any series to a chart, you can specify if you want target series to be attached to a price axis. By default, series are attached to a price axis.
This means one can scale the series with price axis. Note that price axis visible range depends on series values.
In contrast, overlay series just draws itself on a chart independent from the price axis.

```javascript
const lineSeries = chart.addLineSeries({
    overlay: true,
});
```

### Title

When adding any series to a chart, you can name it by adding a string to the `title` property.
This name will be displayed on the label next to the last value label.

```javascript
const lineSeries = chart.addLineSeries({
    title: 'Series title example',
});
```

### Scale margins

Typically, we do not want series to be drawn too close to a chart border. It needs to have some margins on the top and bottom.

By default, the library keeps an empty space below the data (10%) and above the data (20%).

These values could be adjusted for visible axis using chart options.  However, you can also define them for overlay series.

The margins is an object with the following properties:

- `top`
- `bottom`

Each value of an object is a number between 0 (0%) and 1 (100%).

```javascript
const lineSeries = chart.addLineSeries({
    overlay: true,
    scaleMargins: {
        top: 0.6,
        bottom: 0.05,
    },
});
```

The code above places series at the bottom of a chart.

You can change margins using `ChartApi.applyOptions` for the visible axis:

```javascript
chart.applyOptions({
    priceScale: {
        scaleMargins: {
            top: 0.6,
            bottom: 0.05,
        },
    },
});
```

## Data

Every series has its own data type. Please refer to series page to determine what type of data the series uses.

## Methods

### applyOptions

This method is used to apply new options to series.

You can set options initially when you create series or use the `applyOptions` method of the series to change the existing options.

Note that you can only pass options you want to change.

Each series type has its own options. However, there are options that are common for all types of series.

#### Price line

The price line is a horizontal line drawn on the last price value level.

By default, its color is set by the last bar color (or by line color on Line and Area charts).

You can set the width, style and color of this line or disable it using the following options:

|Name|Type|Default|Description|
|----|----|-------|-|
|`priceLineVisible`|`boolean`|`true`|If true, a series' price line is displayed on a chart|
|`priceLineWidth`|`number`|`1`|Price line's width in pixels|
|`priceLineColor`|`string`|`''`|Price line's color|
|`priceLineStyle`|(./constants.md#linestyle)|`LineStyle.Dotted`|Price line's style|

Example:

```javascript
series.applyOptions({
    priceLineVisible: false,
    priceLineWidth: 2,
    priceLineColor: '#4682B4',
    priceLineStyle: 3,
});
```

#### Price labels

By default, the last visible data point price value is shown at relevant level of the price scale as a label.
There is an option to hide it as well.

|Name|Type|Default|Description|
|----|----|-------|-|
|`lastValueVisible`|`boolean`|`true`|If true, a label with the current price value is displayed on the price scale|

Example:

```javascript
series.applyOptions({
    lastValueVisible: false,
});
```

#### Base line

The base line is a horizontal line drawn at the zero-level in `percentage` and `indexedTo100` modes.
You can set the width, style and color of this line or disable it using the following options:

|Name|Type|Default|Description|
|----|----|-------|-|
|`baseLineVisible`|`boolean`|`true`|If true, a series' base line is displayed on a chart|
|`baseLineWidth`|`number`|`1`|Base line's width in pixels|
|`baseLineColor`|`string`|`'#B2B5BE'`|Base line's color|
|`baseLineStyle`|(./constants.md#linestyle)|`LineStyle.Solid`|Base line's style|

Example:

```javascript
series.applyOptions({
    baseLineVisible: true,
    baseLineColor: '#ff0000',
    baseLineWidth: 3,
    baseLineStyle: 1,
});
```

#### Price format

Three price formats are provided for displaying on the price scale:

- `price` format, which is set by default, displays absolute price value as it is
- `volume` format reduces number of digits of values over 1000, replacing zeros by letters. For example, '1000' absolute price value is shown as '1K' in a volume format.
- `percent` format replaces absolute values with their percentage change.

The following options are available for setting the price format displayed by any type of series:

|Name|Type|Default|Description|
|----|----|-------|-|
|`type`|one of `price`, `volume` or `percent`|`price`|Sets a type of price displayed by series|
|`precision`|`number`|`2`|Specifies a number of decimal places used for price value display|
|`minMove`|`number`|`0.01`|Sets the minimum possible step size for price value movement|

Example:

```javascript
series.applyOptions({
    priceFormat: {
        type: 'volume',
        precision: 3,
        minMove: 0.05,
    },
});
```

### setData

Allows to set/replace all existing data with new one.

An array of items is expected.

Examples:

```javascript
lineSeries.setData([
    { time: '2018-12-12', value: 24.11 },
    { time: '2018-12-13', value: 31.74 },
]);
```

```javascript
barSeries.setData([
    { time: '2018-12-19', open: 141.77, high: 170.39, low: 120.25, close: 145.72 },
    { time: '2018-12-20', open: 145.72, high: 147.99, low: 100.11, close: 108.19 },
]);
```

### updateData

Adds new data item to the existing set (or updates the latest item if times of the passed/latest items are equal).

A single data item is expected.

Examples:

```javascript
lineSeries.updateData({
    time: '2018-12-12',
    value: 24.11,
});
```

```javascript
barSeries.updateData({
    time: '2018-12-19',
    open: 141.77,
    high: 170.39,
    low: 120.25,
    close: 145.72,
});
```

## Next reading

- [Area series](./area-series.md)
- [Bar series](./bar-series.md)
- [Candle series](./candle-series.md)
- [Histogram series](./histogram-series.md)
- [Line series](./line-series.md)
- [Customization](./customization.md)
