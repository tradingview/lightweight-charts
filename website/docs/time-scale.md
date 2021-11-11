---
sidebar_position: 4
---

# Time Scale

Time scale (or time axis) is a horizontal scale at the bottom of the chart that displays the time of bars.

## Time scale options

See [TimeScaleOptions](/api/interfaces/TimeScaleOptions).

### Tick marks formatter

Tick marks formatter can be used to customize tick marks labels on the time axis.

To customize it, you need to provide the [`tickMarkFormatter` option](/api/#tickmarkformatter).

Where `time` is [Time](/api/#time) object, `type` is [TickMarkType](./api/enums/TickMarkType) enum and `locale` is the currently applied locale of the string type.

This function should return `time` as a string formatted according to `tickMarkType` type (year, month, etc) and `locale`.

Note that the returned string should be the shortest possible value and should have no more than 8 characters. Otherwise, the tick marks will overlap each other.

### Example of time scale customization

```js
chart.applyOptions({
    timeScale: {
        rightOffset: 12,
        barSpacing: 3,
        fixLeftEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        borderVisible: false,
        borderColor: '#fff000',
        visible: true,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time, tickMarkType, locale) => {
            console.log(time, tickMarkType, locale);
            const year = LightweightCharts.isBusinessDay(time) ? time.year : new Date(time * 1000).getUTCFullYear();
            return String(year);
        },
    },
});
```

## Time scale API

See [ITimeScaleApi](/api/interfaces/ITimeScaleApi).

## Logical range

![Logical range](/img/logical-range.png "Logical range")

Red vertical lines here are borders between bars.

Thus, the visible logical range in the image above is from -4.73 to 5.05.

See also [LogicalRange](/api/#logicalrange).
