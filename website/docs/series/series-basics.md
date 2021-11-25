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
