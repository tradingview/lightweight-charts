---
sidebar_position: 3
---

# Time scale

Time scale (or time axis) is a horizontal scale at the bottom of the chart that displays the time of bars.

![Time scale](/img/time-scale.png "Time scale")

Time scale controls a current visible range, allows you to affect or change it, and can convert a time point or [an index](/api/index.md#logical) to a coordinate and vice versa (basically everything related to a x-scale of a chart).

Also, it has a couple of events you can subscribe to to be notified when anything is happened.

To work with time scale you can either change its options or use methods [ITimeScaleApi](/api/interfaces/ITimeScaleApi.md) which could be retrieved by using [`IChartApi.timeScale`](/api/interfaces/IChartApi.md#timescale) method.
All available options are declared in [TimeScaleOptions](/api/interfaces/TimeScaleOptions.md) interface.

Note that you can apply options either via [`ITimeScaleApi.applyOptions`](/api/interfaces/ITimeScaleApi.md#applyoptions) or [`IChartApi.applyOptions`](/api/interfaces/IChartApi.md#applyoptions) with `timeScale` sub-object in passed options - these 2 approaches both have the same effect.

## Logical range

A [logical range](/api/index.md#logicalrange) is an object with 2 properties: `from` and `to`, which are numbers and represent logical indexes on the time scale.

The starting point of the time scale's logical range is the first data item among all series.
Before that point all indexes are negative, starting from that point - positive.

Indexes might have fractional parts, for instance `4.2`, due to the time-scale being continuous rather than discrete.

Integer part of the logical index means index of the fully visible bar.
Thus, if we have `5.2` as the last visible logical index (`to` field), that means that the last visible bar has index 5, but we also have partially visible (for 20%) 6th bar.
Half (e.g. `1.5`, `3.5`, `10.5`) means exactly a middle of the bar.

![Logical range](/img/logical-range.png "Logical range")

Red vertical lines here are borders between bars.

Thus, the visible logical range on the chart above is approximately from `-4.73` to `5.05`.
