# Grouped bars series

A [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series)
that draws several values per time point as columns side by side, one group
of columns per point.

Use it to compare a few quantities period by period, when a stack would hide
the smaller ones: revenue by region per quarter, buy and sell volume per day,
or a forecast next to the actual value.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-grouped-bars-series
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { createGroupedBarsSeries } from '@tradingview/lwc-plugin-grouped-bars-series';

const chart = createChart(document.getElementById('container'));
const series = createGroupedBarsSeries(chart, {
    colors: ['#2962FF', '#F23645', '#FF9800'],
});

series.setData([
    { time: '2024-04-22', values: [12, 8, 5] },
    { time: '2024-04-23', values: [14, 7, 6] },
    { time: '2024-04-24', values: [11, 9, 4] },
]);
```

### CDN

The plugin is published as ES modules. Map the library and the plugin to their
CDN builds with an import map:

```html
<script type="importmap">
{
  "imports": {
    "lightweight-charts": "https://unpkg.com/lightweight-charts@^5/dist/lightweight-charts.standalone.production.mjs",
    "@tradingview/lwc-plugin-grouped-bars-series": "https://unpkg.com/@tradingview/lwc-plugin-grouped-bars-series/dist/grouped-bars-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart } from 'lightweight-charts';
import { createGroupedBarsSeries } from '@tradingview/lwc-plugin-grouped-bars-series';

const chart = createChart(document.getElementById('container'));
const series = createGroupedBarsSeries(chart, {
    colors: ['#2962FF', '#F23645', '#FF9800'],
});

series.setData([
    { time: '2024-04-22', values: [12, 8, 5] },
    { time: '2024-04-23', values: [14, 7, 6] },
    { time: '2024-04-24', values: [11, 9, 4] },
]);
</script>
```

## Usage

Add the series with `createGroupedBarsSeries`, then set data with a `values`
array per point. The array order is the column order: `values[0]` is the
leftmost column of the group.

```js
import { createChart } from 'lightweight-charts';
import { createGroupedBarsSeries } from '@tradingview/lwc-plugin-grouped-bars-series';

const chart = createChart(document.getElementById('container'), {
    timeScale: { barSpacing: 18, minBarSpacing: 6 },
});
const series = createGroupedBarsSeries(chart, {
    colors: ['#2962FF', '#F23645', '#FF9800'],
    widthPercent: 80,
});

series.setData([
    { time: '2024-04-22', values: [12, 8, 5] },
    { time: '2024-04-23', values: [14, -7, 6] },
    { time: '2024-04-24' },
    { time: '2024-04-25', values: [11, 9, 4], colors: [undefined, '#131722'] },
]);
```

Each data point is `{ time, values: (number | null)[] }`. A point with an empty or
missing `values` array is whitespace: it keeps its place on the time scale and
draws nothing. Columns grow from `base` (`0` by default), up for values above
it and down for values below it. A `null` value, a number which is not finite,
and a value equal to `base`, which would draw a column of no height, leave
their column empty and stay out of the autoscale range, and the other columns
keep their places; use `null` for a missing value coming from JSON, which has
no `NaN`. A point none of whose values draws a column is whitespace.

Every group is split into as many columns as the longest point has values, so
a column is as wide in every group; a point with fewer values leaves its last
columns empty.

A point may override the series colors for its own columns with a `colors`
array. A missing or `undefined` entry keeps the series color for that column.

The series' price line and last value label follow the last value of the last
point that draws a column. Options can be changed at runtime with
`series.applyOptions({ ... })`.

## Creating a series

Use `createGroupedBarsSeries(chart, options?, paneIndex?)`. It returns the
normal series API, with the plugin's data and options types preserved. It
makes `base` available to the series before the first `setData`, so the base
line is part of the autoscale range from the start, and changing `base`
through `series.applyOptions` rescales the series without setting the data
again. The helper keeps a shallow copy of the input data for that purpose,
and counts the columns once per data change: a streamed `update()` recounts
them over all the points once, on the next redraw.

The `GroupedBarsSeries` class remains available for
`chart.addCustomSeries(new GroupedBarsSeries(), options)`. Added that way, the
series only learns its options at the first render, so the data set before
then is read as if `base` were `0` until the data is set again: values around
100 with `base: 50` are stretched down to 0, and a value of `0`, equal to that
assumed base, draws nothing. It also counts the columns over all its points
on every redraw, after a scroll, a zoom or a data change.

## Options

In addition to the standard
[series options](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `colors` | `string[]` | `['#2962FF', '#E1575A', '#F28E2C', 'rgb(164, 89, 209)', 'rgb(27, 156, 133)']` | Fill color of each column, in the order of `values`. If there are more values than colors, the colors repeat. An empty array falls back to this default. |
| `base` | `number` | `0` | Price the columns are drawn from. It is part of the autoscale range, so the base line always stays in view. |
| `columnWidthMode` | `'percent' \| 'histogram'` | `'percent'` | How wide a group is: a share of the bar spacing, given by `widthPercent`, or as wide as the built-in histogram's columns, the whole bar spacing but a one pixel gap. |
| `widthPercent` | `number` | `80` | Share of the bar spacing that each group fills in `percent` mode, `0`–`100`. The rest is the gap between neighboring groups; at `100` they touch, or are a device pixel apart where the bar spacing covers a fractional number of them. |

Per-point overrides, on the data item:

| Field | Type | Description |
| --- | --- | --- |
| `colors` | `(string \| undefined)[]` | Fill color of each column of this point. A missing or `undefined` entry falls back to the series color for that column. |

`values` is typed `(number | null)[]`.

The standard `color` option is not used for the columns; it colors the
series' price line.

## Notes

- In `percent` mode every group is the same whole number of device pixels
  wide. In `histogram` mode groups can differ by a pixel, as the built-in
  histogram's columns do, to keep the gap between them even. Each group's
  width is split among its columns so that they abut with no seam and no
  overlap and differ by at most one pixel, as long as every column gets at
  least one device pixel. Set `timeScale.minBarSpacing` to keep that when the
  user zooms out. Below it, every column still gets a pixel and columns share
  pixels: the tallest are drawn first so that the shorter ones stay visible.
- Only the points on screen are drawn. The series is never conflated: with
  `timeScale.enableConflation` on, the chart still draws every point.
- On `lightweight-charts` 5.2 and later the series reports the column nearest
  the pointer through `hitTest`, within the series' `hitTestTolerance` (3 px
  by default): the crosshair event's `hoveredInfo.objectId` is
  `'column-<point>-<index>'`, where `<point>` is the point's position in
  `series.data()` and `<index>` the column's index in its `values`. The
  nearest column can belong to the next point, so read the point from
  `<point>` rather than from the crosshair's time. Elsewhere in a point's slot,
  between its lowest and highest value or the base, the chart's own fallback
  still reports the series as hovered, without an `objectId`. Older versions
  never call `hitTest`.
