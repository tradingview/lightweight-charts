---
sidebar_position: 0
---

# Series Basics

## Binding to price scale

When adding any series to a chart, you can specify if you want the target series to be attached to a certain price axis - left or right.
By default, series are attached to the right price axis.
This means one can scale the series with price axis. Note that price axis visible range depends on series values.

```js
const lineSeries = chart.addLineSeries({
    priceScaleId: 'left',
});
```

In contrast, an overlay series just draws itself on a chart independent from the visible price axis.
To create an overlay specify a unique id as a `priceScaleId` or just keep is as an empty string.

```js
const lineSeries = chart.addLineSeries({
    priceScaleId: 'my-overlay-id',
});
```

At any moment you can get access to the price scale the series is bound to with `priceScale` method and change its options

```js
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

## Scale margins

Typically, we do not want series to be drawn too close to a chart border. It needs to have some margins on the top and bottom.

By default, the library keeps an empty space below the data (10%) and above the data (20%).

These values could be adjusted for visible axis using chart options. However, you can also define them for series.

The margins is an object with the following properties:

- `top`
- `bottom`

Each value of an object is a number between 0 (0%) and 1 (100%).

```js
const lineSeries = chart.addLineSeries({
    priceScaleId: 'right',
    scaleMargins: {
        top: 0.6,
        bottom: 0.05,
    },
});
```

The code above places series at the bottom of a chart.

You can change margins using `ChartApi.applyOptions` for the certain axis:

```js
chart.applyOptions({
    rightPriceScale: {
        scaleMargins: {
            top: 0.6,
            bottom: 0.05,
        },
    },
});
```

## Methods

### barsInLogicalRange

Returns bars information for the series in the provided [logical range](../time-scale.md#logical-range) or `null`, if no series data has been found in the requested range.

The returned value is an object with the following properties:

- `from` - a [Time](/api/#time) of the first series' bar inside of the passed logical range or `undefined`, if no bars have been found in the requested range
- `to` - a [Time](/api/#time) of the last series' bar inside of the passed logical range or `undefined`, if no bars have been found in the requested range
- `barsBefore` - a number of bars between the `from` index of the passed logical range and the first series' bar
- `barsAfter` - a number of bars between the `to` index of the passed logical range and the last series' bar

Positive value in the `barsBefore` field means that there are some bars before (out of logical range from the left) the `from` logical index in the series.
Negative value means that the first series' bar is inside the passed logical range, and between the first series' bar and the `from` logical index are some bars.

Positive value in the `barsAfter` field means that there are some bars after (out of logical range from the right) the `to` logical index in the series.
Negative value means that the last series' bar is inside the passed logical range, and between the last series' bar and the `to` logical index are some bars.

```js
// returns bars info in current visible range
const barsInfo = series.barsInLogicalRange(chart.timeScale().getVisibleLogicalRange());
console.log(barsInfo);
```

This method can be used, for instance, to implement downloading historical data while scrolling to prevent a user from seeing empty space.
Thus, you can subscribe to [visible logical range changed event](/api/interfaces/ITimeScaleApi#subscribeVisibleLogicalRangeChange), get count of bars in front of the visible range and load additional data if it is needed:

```js
function onVisibleLogicalRangeChanged(newVisibleLogicalRange) {
    const barsInfo = series.barsInLogicalRange(newVisibleLogicalRange);
    // if there less than 50 bars to the left of the visible area
    if (barsInfo !== null && barsInfo.barsBefore < 50) {
        // try to load additional historical data and prepend it to the series data
    }
}

chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChanged);
```
