---
sidebar_position: 5
---

# Time scale

## Overview

Time scale (or time axis) is a horizontal scale at the bottom of the chart that displays the time of bars.

![Time scale](/img/time-scale.png "Time scale")

Time scale controls a current visible range, allows you to affect or change it, and can convert a time point or [an index](/api/type-aliases/Logical.md) to a coordinate and vice versa (basically everything related to a x-scale of a chart).

Also, it has a couple of events you can subscribe to to be notified when anything is happened.

To work with time scale you can either change its options or use methods [ITimeScaleApi](/api/interfaces/ITimeScaleApi.md) which could be retrieved by using [`IChartApi.timeScale`](/api/interfaces/IChartApi.md#timescale) method.
All available options are declared in [TimeScaleOptions](/api/interfaces/TimeScaleOptions.md) interface.

Note that you can apply options either via [`ITimeScaleApi.applyOptions`](/api/interfaces/ITimeScaleApi.md#applyoptions) or [`IChartApi.applyOptions`](/api/interfaces/IChartApi.md#applyoptions) with `timeScale` sub-object in passed options - these 2 approaches both have the same effect.

## Logical range

A [logical range](/api/type-aliases/LogicalRange.md) is an object with 2 properties: `from` and `to`, which are numbers and represent logical indexes on the time scale.

The starting point of the time scale's logical range is the first data item among all series.
Before that point all indexes are negative, starting from that point - positive.

Indexes might have fractional parts, for instance `4.2`, due to the time-scale being continuous rather than discrete.

Integer part of the logical index means index of the fully visible bar.
Thus, if we have `5.2` as the last visible logical index (`to` field), that means that the last visible bar has index 5, but we also have partially visible (for 20%) 6th bar.
Half (e.g. `1.5`, `3.5`, `10.5`) means exactly a middle of the bar.

![Logical range](/img/logical-range.png "Logical range")

Red vertical lines here are borders between bars.

Thus, the visible logical range on the chart above is approximately from `-4.73` to `5.05`.

## Chart margin

Margin is the space between the chart's borders and the series. It depends on the following time scale options:

- [`barSpacing`](/api/interfaces/TimeScaleOptions.md#barspacing). The default value is `6`.
- [`rightOffset`](/api/interfaces/TimeScaleOptions.md#rightoffset). The default value is `0`.

You can specify these options as described in [Overview](#overview).

Note that if a series contains only a few data points, the chart may have a large margin on the left side.

![A series with a few points](/img/extra-margin.png)

In this case, you can call the [`fitContent`](/api/interfaces/ITimeScaleApi.md#fitcontent) method that adjust the view and fits all data within the chart.

```javascript
chart.timeScale().fitContent();
```

If calling `fitContent` has no effect, it might be due to how the library displays data.

The library allocates specific width for each data point to maintain consistency between different chart types.
For example, for line series, the plot point is placed at the center of this allocated space, while candlestick series use most of the width for the candle body.
The allocated space for each data point is proportional to the chart width.
As a result, series with fewer data points may have a small margin on both sides.

![Margin](/img/margin.png)

You can specify the [logical range](#logical-range) with the [`setVisibleLogicalRange`](/api/interfaces/ITimeScaleApi.md#setvisiblelogicalrange) method to display the series exactly to the edges.
For example, the code sample below adjusts the range by half a bar-width on both sides.

```javascript
const vr = chart.timeScale().getVisibleLogicalRange();
chart.timeScale().setVisibleLogicalRange({ from: vr.from + 0.5, to: vr.to - 0.5 });
```
