---
sidebar_position: 5
---

# Time scale

The **time scale** (or time axis) is a horizontal scale that displays the time of data points at the bottom of the chart.

![Time scale](/img/time-scale.png "Time scale")

The horizontal scale can also represent price or other custom values. Refer to the [Chart types](/chart-types.mdx) article for more information.

## Time scale appearance

Use [`TimeScaleOptions`](/api/interfaces/TimeScaleOptions.md) to adjust the time scale appearance. You can specify these options in two ways:

- On chart initialization. To do this, provide the desired options as a [`timeScale`](api/interfaces/ChartOptionsBase#timescale) parameter when calling [`createChart`](/api/functions/createChart.md).
- On the fly using either the [`ITimeScaleApi.applyOptions`](/api/interfaces/ITimeScaleApi.md#applyoptions) or [`IChartApi.applyOptions`](/api/interfaces/IChartApi.md#applyoptions) method. Both methods produce the same result.

## Time scale API

Call the [`IChartApi.timeScale`](/api/interfaces/IChartApi.md#timescale) method to get an instance of the [`ITimeScaleApi`](/api/interfaces/ITimeScaleApi.md) interface. This interface provides an extensive API for controlling the time scale. For example, you can adjust the visible range, convert a time point or [index](/api/type-aliases/Logical.md) to a coordinate, and subscribe to events.

```javascript
chart.timeScale().resetTimeScale();
```

## Visible range

Visible range is a chart area that is currently visible on the canvas. This area can be measured with both [data](#data-range) and [logical](#logical-range) range.
Data range usually includes bar timestamps, while logical range has bar indices.

You can adjust the visible range using the following methods:

- [`setVisibleRange`]
- [`getVisibleRange`]
- [`setVisibleLogicalRange`]
- [`getVisibleLogicalRange`]

## Data range

The data range includes only values from the first to the last bar visible on the chart. If the visible area has empty space, this part of the scale is not included in the data range.

Note that you cannot extrapolate time with the [`setVisibleRange`] method. For example, the chart does not have data prior `2018-01-01` date. If you set the visible range from `2016-01-01`, it will be automatically adjusted to `2018-01-01`.

If you want to adjust the visible range more flexible, operate with the [logical range](#logical-range) instead.

## Logical range

The logical range represents a continuous line of values. These values are logical [indices](/api/type-aliases/Logical.md) on the scale that illustrated as red lines in the image below:

![Logical range](/img/logical-range.png "Logical range")

The logical range starts from the first data point across all series, with negative indices before it and positive ones after.

The indices can have fractional parts. The integer part represents the fully visible bar, while the fractional part indicates partial visibility. For example, the `5.2` index means that the fifth bar is fully visible, while the sixth bar is 20% visible.
A half-index, such as `3.5`, represents the middle of the bar.

In the library, the logical range is represented with the [`LogicalRange`](/api/type-aliases/LogicalRange.md) object. This object has the `from` and `to` properties, which are logical indices on the time scale. For example, the visible logical range on the chart above is approximately from `-4.73` to `5.05`.

The [`setVisibleLogicalRange`] method allows you to specify the visible range beyond the bounds of the available data. This can be useful for setting a [chart margin](#chart-margin) or aligning series visually.

## Number of visible bars

The number of bars that fit in the visible area depends on the time scale width and the [`barSpacing`](/api/interfaces/TimeScaleOptions.md#barspacing) option. The time scale width is the chart width without the price scales. To get it, call the [`width`](/api/interfaces/ITimeScaleApi.md#width) method.

Before the data is set, you can only estimate this number. After the data is set, you can measure it exactly.

### Estimating before the data is set

Divide the time scale width by `barSpacing` to estimate how much data to load, for example, to fill the whole viewport with data from a remote API:

```javascript
const timeScale = chart.timeScale();
const visibleBars = Math.ceil(timeScale.width() / timeScale.options().barSpacing);
```

Note the following:

- The result is an estimate. The exact width of the time scale depends on the price scale width, which is known only after the data is set.
- `barSpacing` returned by [`options`](/api/interfaces/ITimeScaleApi.md#options) is the current bar spacing, which changes when the user zooms the chart. It can differ from the value you passed in the options.
- The [`rightOffset`](/api/interfaces/TimeScaleOptions.md#rightoffset) and [`rightOffsetPixels`](/api/interfaces/TimeScaleOptions.md#rightoffsetpixels) options add a margin to the right of the last bar. This margin reduces the number of bars visible after the first render. For example, with `rightOffset` set to `5`, five fewer bars are visible than the estimate.
- If both [`fixLeftEdge`](/api/interfaces/TimeScaleOptions.md#fixleftedge) and [`fixRightEdge`](/api/interfaces/TimeScaleOptions.md#fixrightedge) are enabled, the library increases `barSpacing` as needed so that all loaded bars always fill the visible area.

### Measuring after the data is set

Use the [`getVisibleLogicalRange`] method to get the size of the visible logical range as the difference between `to` and `from`. Note that this range can include empty space before the first bar or after the last one.

To check how many bars of a series are outside the visible range, use [`barsInLogicalRange`](/api/interfaces/ISeriesApi.md#barsinlogicalrange).
To load more data while the user scrolls, subscribe to range changes with [`subscribeVisibleLogicalRangeChange`](/api/interfaces/ITimeScaleApi.md#subscribevisiblelogicalrangechange) as shown in the [Infinite history](/tutorials/demos/infinite-history) tutorial.

## Chart margin

Margin is the space between the chart's borders and the series. It depends on the following time scale options:

- [`barSpacing`](/api/interfaces/TimeScaleOptions.md#barspacing). The default value is `6`.
- [`rightOffset`](/api/interfaces/TimeScaleOptions.md#rightoffset). The default value is `0`.

You can specify these options as described [above](#time-scale-appearance).

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

[`setVisibleRange`]: /api/interfaces/ITimeScaleApi.md#setvisiblerange
[`getVisibleRange`]: /api/interfaces/ITimeScaleApi.md#getvisiblerange
[`setVisibleLogicalRange`]: /api/interfaces/ITimeScaleApi.md#setvisiblelogicalrange
[`getVisibleLogicalRange`]: /api/interfaces/ITimeScaleApi.md#getvisiblelogicalrange
