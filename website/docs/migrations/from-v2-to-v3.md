# From v2 to v3

Lightweight charts library 3.0 announces the major improvements: supporting two price scales and improving the time scale API.
In order of keep the API clear and consistent, we decided to allow breaking change of the API.

In this document you can find the migration guide from the previous version to 3.0.

## Time Scale API

Previously, to handle changing visible time range you needed to use `subscribeVisibleTimeRangeChange` and `unsubscribeVisibleTimeRangeChange` to subscribe and unsubscribe from visible range events.
These methods were available in the chart object  (e.g. you call it like `chart.subscribeVisibleTimeRangeChange(func)`).

In 3.0 in order to make API more consistent with the new API we decided to move these methods to [ITimeScaleApi](/api/interfaces/ITimeScaleApi.md)
(along with the new subscription methods [`ITimeScaleApi.subscribeVisibleLogicalRangeChange`](/api/interfaces/ITimeScaleApi.md#subscribevisiblelogicalrangechange) and [`ITimeScaleApi.unsubscribeVisibleLogicalRangeChange`](/api/interfaces/ITimeScaleApi.md#unsubscribevisiblelogicalrangechange)).

So, to migrate your code to 3.0 you just need to replace:

- `chart.subscribeVisibleTimeRangeChange` with `chart.timeScale().subscribeVisibleTimeRangeChange`
- `chart.unsubscribeVisibleTimeRangeChange` with `chart.timeScale().unsubscribeVisibleTimeRangeChange`

## Two price scales

We understand disadvantages of breaking changes in the API, so we have not removed support of the current API at all, but have deprecated it, so the most common cases will continue to work.

You can refer to the new API [here](../price-scale.md).

Following are migration rules.

### Default behavior

Default behavior is not changed. If you do not specify price scale options, the chart will have the right price scale visible and all the series will assign to it.

### Left price scale

If you need the price scale to be drawn on the left side, you should make the following changes.
instead of

```js
const chart = LightweightCharts.createChart(container, {
    priceScale: {
        position: 'left',
    },
});
```

use

```js
const chart = LightweightCharts.createChart(container, {
    rightPriceScale: {
        visible: false,
    },
    leftPriceScale: {
        visible: true,
    },
});
```

then specify target price scale while creating a series:

```js
const histSeries = chart.addHistogramSeries({
    priceScaleId: 'left',
});
```

New version fully supports this case via the old API, however this support will be removed in the future releases.

### No price scale

To create chart without any visible price scale, instead of

```js
const chart = LightweightCharts.createChart(container, {
    priceScale: {
        position: 'none',
    },
});
```

use

```js
const chart = LightweightCharts.createChart(container, {
    leftPriceScale: {
        visible: false,
    },
    rightPriceScale: {
        visible: false,
    },
});
```

New version fully supports this case via the old API, however this support will be removed in the future releases.

### Creating overlay

To create an overlay series, instead of

```js
const histogramSeries = chart.addHistogramSeries({
    overlay: true,
});
```

use

```js
const histogramSeries = chart.addHistogramSeries({
    // or any other _the same_ id for all overlay series
    priceScaleId: '',
});
```

New version fully supports this case via the old API, however this support will be removed in the future releases.

### Move price scale from right to left or vice versa

To do this, instead of

```js
const chart = LightweightCharts.createChart(container);

const mainSeries = chart.addLineSeries();

// ...

chart.applyOptions({
    priceScale: {
        position: 'left',
    },
});
```

use

```js
const chart = LightweightCharts.createChart(container);

const mainSeries = chart.addLineSeries();

// ...

chart.applyOptions({
    leftPriceScale: {
        visible: true,
    },
    rightPriceScale: {
        visible: false,
    },
});

mainSeries.applyOptions({
    priceScaleId: 'left',
});
```

New version does not support this case via the old API, so, if you use it, you should migrate your code in order of keeping it working.
