---
sidebar_position: 5
---

# Time scale

## Overview

Time scale (or time axis) is a horizontal scale that displays the time of data points at the bottom of the chart.

![Time scale](/img/time-scale.png "Time scale")

To adjust the time scale appearance, use either the [`ITimeScaleApi.applyOptions`](/api/interfaces/ITimeScaleApi.md#applyoptions) or [`IChartApi.applyOptions`](/api/interfaces/IChartApi.md#applyoptions) method. Both methods produce the same result. Refer to [`TimeScaleOptions`](/api/interfaces/TimeScaleOptions.md) for a list of available options.

You can call the [`IChartApi.timeScale`](/api/interfaces/IChartApi.md#timescale) method to manage the scale.
This method returns an instance of the [`ITimeScaleApi`](/api/interfaces/ITimeScaleApi.md) interface that provides an extensive API for controlling the time scale. For example, you can adjust the visible range, convert a time point or [index](/api/type-aliases/Logical.md) to a coordinate, and subscribe to events.

## Logical range

The time scale can be measured with both a time range and a logical range.
The logical range is illustrated below with red vertical lines between bars. Each line represents a logical [index](/api/type-aliases/Logical.md) on the scale.

![Logical range](/img/logical-range.png "Logical range")

The logical range starts from the first data point across all series, with negative indices before it and positive ones after.

The indices can have fractional parts. The integer part represents the fully visible bar, while the fractional part indicates partial visibility. For example, the `5.2` index means that the fifth bar is fully visible, while the sixth bar is 20% visible.
A half-index, such as `3.5`, represents the middle of the bar.

In the library, the logical range is represented with a [`LogicalRange`](/api/type-aliases/LogicalRange.md) object. This object has the `from` and `to` properties, which are logical indices on the time scale. For example, the visible logical range on the chart above is approximately from `-4.73` to `5.05`.

You can manage the logical range with [`ITimeScaleApi`](/api/interfaces/ITimeScaleApi.md) as described in the [overview](#overview).

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
