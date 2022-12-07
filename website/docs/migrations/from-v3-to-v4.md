# From v3 to v4

In this document you can find the migration guide from the previous version v3 to v4.

## Exported enum `LasPriceAnimationMode` has been removed

Please use [`LastPriceAnimationMode`](/api/enums/LastPriceAnimationMode.md) instead.

## `scaleMargins` option has been removed from series options

Previously, you could do something like the following:

```js
const series = chart.addLineSeries({
    scaleMargins: { /* options here */},
});
```

And `scaleMargins` option was applied to series' price scale as `scaleMargins` option.

Since v4 this option won't be applied to the price scale and will be just ignored (if you're using TypeScript you will get a compilation error).

To fix this, you need to apply these options to series' price scale:

```js
const series = chart.addLineSeries();

series.priceScale().applyOptions({
    scaleMargins: { /* options here */},
});
```

## `backgroundColor` from `layout` options has been removed

If you want to have solid background color you need to use [`background`](/api/interfaces/LayoutOptions.md#background) property instead, e.g. instead of:

```js
const chart = createChart({
    layout: {
        backgroundColor: 'red',
    },
});
```

use

```js
const chart = createChart({
    layout: {
        background: {
            type: ColorType.Solid,
            color: 'red',
        },
    },
});
```

## `overlay` property of series options has been removed

Please follow [the guide for migrating from v2 to v3](./from-v2-to-v3.md#creating-overlay) where this option was deprecated.

## `priceScale` option has been removed

Please follow [the guide for migrating from v2 to v3](./from-v2-to-v3.md#two-price-scales).

## `priceScale()` method of chart API now requires to provide price scale id

Before v4 you could write the following code:

```js
const priceScale = chart.priceScale();
```

And in `priceScale` you had a right price scale if it is visible and a left price scale otherwise.

Since v4 you have to provide an ID of price scale explicitly, e.g. if you want to get a right price scale you need to provide `'right'`:

```js
const rightPriceScale = chart.priceScale('right');
const leftPriceScale = chart.priceScale('left');
```

## `drawTicks` from `leftPriceScale` and `rightPriceScale` options has been renamed to `ticksVisible`

Since v4 you have to use `ticksVisible` instead of `drawTicks`.

```js
const chart = createChart({
    leftPriceScale: {
        ticksVisible: false,
    },
    rightPriceScale: {
        ticksVisible: false,
    },
});
```

Also this option is off by default.

## The type of outbound time values has been changed

Affected API:

- [`IChartApi.subscribeClick`](/api/interfaces/IChartApi.md#subscribeclick) (via [`MouseEventParams.time`](/api/interfaces/MouseEventParams.md#time))
- [`IChartApi.subscribeCrosshairMove`](/api/interfaces/IChartApi.md#subscribecrosshairmove) (via [`MouseEventParams.time`](/api/interfaces/MouseEventParams.md#time))
- [`LocalizationOptions.timeFormatter`](/api/interfaces/LocalizationOptions.md#timeformatter) (via argument of [`TimeFormatterFn`](/api/index.md#timeformatterfn))
- [`TimeScaleOptions.tickMarkFormatter`](/api/interfaces/TimeScaleOptions.md#tickmarkformatter) (via argument of [`TickMarkFormatter`](/api/index.md#tickmarkformatter))

Previously the type of an inbound time (a values you provide to the library, e.g. in [`ISeriesApi.setData`](/api/interfaces/ISeriesApi.md#setdata)) was different from an outbound one (a values the library provides to your code, e.g. an argument of [`LocalizationOptions.timeFormatter`](/api/interfaces/LocalizationOptions.md#timeformatter)).
So the difference between types was that outbound time couldn't be a business day string.

Since v4 we improved our API in this matter and now the library will return exactly the same values back for all time-related properties.

Thus, if you provide a string to your series in [`ISeriesApi.setData`](/api/interfaces/ISeriesApi.md#setdata), you'll receive exactly the same value back:

```js
series.setData([
    { time: '2001-01-01', value: 1 },
]);

chart.applyOptions({
    localization: {
        timeFormatter: time => time, // will be '2001-01-01' for the bar above
    },
    timeScale: {
        tickMarkFormatter: time => time, // will be '2001-01-01' for the bar above
    },
});

chart.subscribeCrosshairMove(param => {
    console.log(param.time); // will be '2001-01-01' if you hover the bar above
});

chart.subscribeClick(param => {
    console.log(param.time); // will be '2001-01-01' if you click on the bar above
});
```

Handling this breaking change depends on your needs and your handlers, but generally speaking you need to convert provided time to a desired format manually if it is required.
For example, you could use provided helpers to check the type of a time:

```js
import {
    createChart,
    isUTCTimestamp,
    isBusinessDay,
} from 'lightweight-charts';

const chart = createChart(document.body);

chart.subscribeClick(param => {
    if (param.time === undefined) {
        // the time is undefined, i.e. there is no any data point where a time could be received from
        return;
    }

    if (isUTCTimestamp(param.time)) {
        // param.time is UTCTimestamp
    } else if (isBusinessDay(param.time)) {
        // param.time is a BusinessDay object
    } else {
        // param.time is a business day string in ISO format, e.g. `'2010-01-01'`
    }
});
```

## `seriesPrices` property from `MouseEventParams` has been removed

Affected API:

- [`IChartApi.subscribeClick`](/api/interfaces/IChartApi.md#subscribeclick)
- [`IChartApi.subscribeCrosshairMove`](/api/interfaces/IChartApi.md#subscribecrosshairmove)

The property `seriesPrices` of [`MouseEventParams`](/api/interfaces/MouseEventParams.md) has been removed.

Instead, you can use [`MouseEventParams.seriesData`](/api/interfaces/MouseEventParams.md#seriesdata) - it is pretty similar to the old `seriesPrices`, but it contains series' data items instead of just prices:

```js
lineSeries.setData([{ time: '2001-01-01', value: 1 }]);
barSeries.setData([{ time: '2001-01-01', open: 5, high: 10, low: 1, close: 7 }]);

chart.subscribeCrosshairMove(param => {
    console.log(param.seriesData.get(lineSeries)); // { time: '2001-01-01', value: 1 } or undefined
    console.log(param.seriesData.get(barSeries)); // { time: '2001-01-01', open: 5, high: 10, low: 1, close: 7 } or undefined
});
```

## `MouseEventParams` field `hoveredMarkerId` was renamed to `hoveredObjectId`

Since v4 you have to use `hoveredObjectId` instead of `hoveredMarkerId`.

```js
chart.subscribeCrosshairMove(param => {
    console.log(param.hoveredObjectId);
});

chart.subscribeClick(param => {
    console.log(param.hoveredObjectId);
});
```
