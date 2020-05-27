# Series basics

Each series has a set of common properties and methods regardless of its type.

For example, to create any type of series you can pass the `title` parameter to set series title.

These "common" parameters and API are described here. If you want to see an API for a specific type of series - see relevant doc page.

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
|`priceScaleId`|`string`|`right` if right scale is visible and `left` if not|Target price scale to bind new series to|
|`title`|`string`|`''`|You can name series when adding it to a chart. This name will be displayed on the label next to the last value label|
|`scaleMargins`|`{ top, bottom }`|`undefined`|[Margins](#scale-margins) of the price scale of series|

Example:

```javascript
const lineSeries = chart.addLineSeries({
    priceScaleId: 'left',
    title: 'Series title example',
    scaleMargins: {
        top: 0.1,
        bottom: 0.3,
    },
});
```

### Binding to price scale

When adding any series to a chart, you can specify if you want target series to be attached to a certain price axis - left or right.
By default, series are attached to the right price axis.
This means one can scale the series with price axis. Note that price axis visible range depends on series values.

```javascript
const lineSeries = chart.addLineSeries({
    priceScaleId: 'left',
});
```

In contrast, overlay series just draws itself on a chart independent from the visible price axis.
To create overlay specify unique id as a `priceScaleId` or just keep is as empty string.

```javascript
const lineSeries = chart.addLineSeries({
    priceScaleId: 'my-overlay-id',
});
```

At any moment you can get access to the price scale the series is bound to with `priceScale` method and change its options

```javascript
const lineSeries = chart.addLineSeries({
    priceScaleId: 'my-overlay-id',
});
lineSeries.priceScale().applyOptions({
    scaleMargins: {
        top: 0.1,
        bottom: 0.3,
    },
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

These values could be adjusted for visible axis using chart options. However, you can also define them for series.

The margins is an object with the following properties:

- `top`
- `bottom`

Each value of an object is a number between 0 (0%) and 1 (100%).

```javascript
const lineSeries = chart.addLineSeries({
    priceScaleId: 'right,
    scaleMargins: {
        top: 0.6,
        bottom: 0.05,
    },
});
```

The code above places series at the bottom of a chart.

You can change margins using `ChartApi.applyOptions` for the certain axis:

```javascript
chart.applyOptions({
    rightPriceScale: {
        scaleMargins: {
            top: 0.6,
            bottom: 0.05,
        },
    },
});
```

### Overriding autoscale

By default, the chart scales data automatically based on visible data range. However, for some reasons one could need overriding this behavior.
There is an option called `autoscaleProvider` that allows overriding visible price range for series

```javascript
var firstSeries = chart.addLineSeries({
    autoscaleInfoProvider: () => {
        return {
            priceRange: {
                minValue: 0,
                maxValue: 100,
            },
        };
    },
});
```

So, you can just add a function that returns an object with `priceRange` field, if you want to override the original series' price range. For example, you can set the range from 0 to 100. These values are in prices.

You can also provide additional margins in pixels. Please be careful and never mix prices and pixels.

```javascript
var firstSeries = chart.addLineSeries({
    autoscaleInfoProvider: () => {
        return {
            priceRange: {
                minValue: 0,
                maxValue: 100,
            },
            margins: {
                above: 10,
                below: 10,
            },
        };
    },
});
```

Actually, `autoscaleInfoProvider` function has an argument `original` which is the default implementation, so you can call it and adjust the result:

```javascript
var firstSeries = chart.addLineSeries({
    autoscaleInfoProvider: (original) => {
        var res = original();
        if (res.priceRange !== null) {
            res.priceRange.minValue -= 10;
            res.priceRange.maxValue += 10;
        }
        return res;
    },
});
```

Note that both `priceRange` and `margins` could be `null` in the default result.

## Removing series

Any series could be removed with

```javascript
chart.removeSeries(series);
```

where `series` is an instance of any series type.

## Data

Every series has its own data type. Please refer to series page to determine what type of data the series uses.

## Methods

### options

Returns the full set of currently applied options, including defaults.

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
|`priceLineSource`|[PriceLineSource](./constants.md#pricelinesource)|`PriceLineSource.LastBar`|Source to be used for the horizontal price line|
|`priceLineWidth`|`number`|`1`|Price line's width in pixels|
|`priceLineColor`|`string`|`''`|Price line's color|
|`priceLineStyle`|[LineStyle](./constants.md#linestyle)|`LineStyle.Dotted`|Price line's style|

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
|`lastValueVisible`|`boolean`|`true`|If true, the label with the current price is displayed on the price scale|

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
|`baseLineStyle`|[LineStyle](./constants.md#linestyle)|`LineStyle.Solid`|Base line's style|

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

Four price formats are provided for displaying on the price scale:

- `price` format, which is set by default, displays absolute price value as it is
- `volume` format reduces number of digits of values over 1000, replacing zeros by letters. For example, '1000' absolute price value is shown as '1K' in a volume format.
- `percent` format replaces absolute values with their percentage change.
- `custom` format uses a user-defined function for price formatting that could be used in some specific cases, that are not covered by standard formatters

The following options are available for setting the price format displayed by any type of series:

|Name|Type|Default|Description|
|----|----|-------|-|
|`type`|`price` &#124; `volume` &#124; `percent` &#124; `custom` |`price`|Sets a type of price displayed by series|
|`precision`|`number`|`2`|Specifies a number of decimal places used for price value display|
|`minMove`|`number`|`0.01`|Sets the minimum possible step size for price value movement|
|`formatter`|`function` &#124; `undefined`|`undefined`|Sets a formatting function that is used when the `type` is `custom`|

Examples:

```javascript
series.applyOptions({
    priceFormat: {
        type: 'volume',
        precision: 3,
        minMove: 0.05,
    },
});
```

```javascript
series.applyOptions({
    priceFormat: {
        type: 'custom',
        minMove: 0.02,
        formatter: function(price) {
            return '$' + price.toFixed(2);
        },
    }
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

### update

Adds new data item to the existing set (or updates the latest item if times of the passed/latest items are equal).

A single data item is expected.

Examples:

```javascript
lineSeries.update({
    time: '2018-12-12',
    value: 24.11,
});
```

```javascript
barSeries.update({
    time: '2018-12-19',
    open: 141.77,
    high: 170.39,
    low: 120.25,
    close: 145.72,
});
```

### setMarkers

Allows to set/replace all existing series markers with new ones.

An array of items is expected. An array must be sorted ascending by `time`. Each item should contain the following fields:

- `time` ([Time](./time.md)) - item time
- `position` (`aboveBar` &#124; `belowBar` &#124; `inBar`) - item position
- `shape` (`circle` &#124; `square` &#124; `arrowUp` &#124; `arrowDown`) - item marker type
- `size` (`number` &#124; `undefined`) - size multiplier of the marker, the shape is hidden when set to `0`, default value is `1`
- `color` (`string`) - item color
- `id` (`string` &#124; `undefined`) - item id, will be passed to click/crosshair move handlers
- `text` (`string` &#124; `undefined`) - item text to be shown

Example:

```javascript
series.setMarkers([
    {
        time: '2019-04-09',
        position: 'aboveBar',
        color: 'black',
        shape: 'arrowDown',
    },
    {
        time: '2019-05-31',
        position: 'belowBar',
        color: 'red',
        shape: 'arrowUp',
        id: 'id3',
    },
    {
        time: '2019-05-31',
        position: 'belowBar',
        color: 'orange',
        shape: 'arrowUp',
        id: 'id4',
        text: 'example',
        size: 2,
    },
]);

chart.subscribeCrosshairMove(function(param) {
    console.log(param.hoveredMarkerId);
});

chart.subscribeClick(function(param) {
    console.log(param.hoveredMarkerId);
});
```

### createPriceLine

Creates a horizontal price line at a certain price level. The method returns an object that has two methods:

- `options()` - returns the price line options
- `applyOptions(options)` - sets the price line options

You can set the price level, width, style and color of this line using the following options:

|Name|Type|Default|Description|
|----|----|-------|-|
|`price`| `number` | `0` | Price line's level |
|`lineColor`|`string`|`''`|Price line's color|
|`lineWidth`|`number`|`1`|Price line's width in pixels|
|`lineStyle`|[LineStyle](./constants.md#linestyle)|`LineStyle.Solid`|Price line's style|
|`axisLabelVisible`|`boolean`|`true`|If true, a label with the current price value is displayed on the price scale|

Example:

```javascript
const priceLine = series.createPriceLine({
    price: 80.0,
    color: 'green',
    lineWidth: 2,
    lineStyle: LightweightCharts.LineStyle.Dotted,
    axisLabelVisible: true,
});

priceLine.applyOptions({
    price: 90.0,
    color: 'red',
    lineWidth: 3,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    axisLabelVisible: false,
});
```

### removePriceLine

Removes the price line that was created before.

Example:

```javascript
const priceLine = series.createPriceLine({ price: 80.0 });
series.removePriceLine(priceLine);
```

### barsInLogicalRange

Returns bars information for the series in the provided [logical range](./time-scale.md#logical-range) or `null`, if no series data has been found in the requested range.

The returned value is an object with the following properties:

- `from` - a [Time](./time.md) of the first series' bar inside of the passed logical range or `undefined`, if no bars have been found in the requested range
- `to` - a [Time](./time.md) of the last series' bar inside of the passed logical range or `undefined`, if no bars have been found in the requested range
- `barsBefore` - a number of bars between the `from` index of the passed logical range and the first series' bar
- `barsAfter` - a number of bars between the `to` index of the passed logical range and the last series' bar

Positive value in `barsBefore` field means that there are some bars before (out of logical range from the left) the `from` logical index in the series.
Negative value means that the first series' bar is inside the passed logical range, and between the first series' bar and the `from` logical index are some bars.

Positive value in `barsAfter` field means that there are some bars after (out of logical range from the right) the `to` logical index in the series.
Negative value means that the last series' bar is inside the passed logical range, and between the last series' bar and the `to` logical index are some bars.

```javascript
// returns bars info in current visible range
const barsInfo = series.barsInLogicalRange(chart.timeScale().getVisibleLogicalRange());
console.log(barsInfo);
```

This method can be used, for instance, to implement downloading historical data while scrolling to prevent a user from seeing empty space.
Thus, you can subscribe to [visible logical range changed event](./time-scale.md#subscribeVisibleLogicalRangeChange), get count of bars in front of the visible range and load additional data if it is needed:

```javascript
function onVisibleLogicalRangeChanged(newVisibleLogicalRange) {
    const barsInfo = series.barsInLogicalRange(newVisibleLogicalRange);
    // if there less than 50 bars to the left of the visible area
    if (barsInfo !== null && barsInfo.barsBefore < 50) {
        // try to load additional historical data and prepend it to the series data
    }
}

chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChanged);
```

## Taking screenshot

Takes the whole chart screenshot.

```javascript
const screenshot = chart.takeScreenshot();
```

The function returns a `canvas` element with the chart drawn on it. Any `Canvas` methods like `toDataURL()` or `toBlob()` can be used to serialize the result.

## Coordinates and prices converting

Each series has an associated price scale object. If the series has been created as an overlay,
it has an invisible price scale to convert prices to coordinates and vice versa.
There are two functions to access this price scale implicitly.

### priceToCoordinate

This function accepts price value and returns corresponding coordinate or `null`.

```javascript
const coordinate = series.priceToCoordinate(100.5);
```

### coordinateToPrice

This function accepts coordinate and returns corresponding price value or `null`.

```javascript
const price = series.coordinateToPrice(324);
```

## Next reading

- [Area series](./area-series.md)
- [Bar series](./bar-series.md)
- [Candlestick series](./candlestick-series.md)
- [Histogram series](./histogram-series.md)
- [Line series](./line-series.md)
- [Customization](./customization.md)
