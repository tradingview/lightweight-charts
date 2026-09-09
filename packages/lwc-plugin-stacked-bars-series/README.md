# Stacked bars series

A [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series) that stacks several values per
time point into one column.
Each value is a segment drawn on top of the previous one. The column height
shows the total, and the segments show its composition.

Use it to show composition over time in discrete periods, when a bar reads
better than an area. Typical examples: volume by venue, revenue by product
line, or trades by side.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-stacked-bars-series
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { createStackedBarsSeries } from '@tradingview/lwc-plugin-stacked-bars-series';

const chart = createChart(document.getElementById('container'));
const series = createStackedBarsSeries(chart, {
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
    "@tradingview/lwc-plugin-stacked-bars-series": "https://unpkg.com/@tradingview/lwc-plugin-stacked-bars-series/dist/stacked-bars-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart } from 'lightweight-charts';
import { createStackedBarsSeries } from '@tradingview/lwc-plugin-stacked-bars-series';

const chart = createChart(document.getElementById('container'));
const series = createStackedBarsSeries(chart, {
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

Add the series with `addCustomSeries`, then set data with a `values` array per
point. The array order is the stacking order: `values[0]` is the bottom
segment.

```js
import { createChart } from 'lightweight-charts';
import { createStackedBarsSeries } from '@tradingview/lwc-plugin-stacked-bars-series';

const chart = createChart(document.getElementById('container'), {
    timeScale: { minBarSpacing: 3 },
});
const series = createStackedBarsSeries(chart, {
    colors: ['#2962FF', '#F23645', '#FF9800'],
});

series.setData([
    { time: '2024-04-22', values: [12, 8, 5] },
    { time: '2024-04-23', values: [14, 7, 6] },
    { time: '2024-04-24', values: [11, 9, 4] },
]);
```

Each data point is `{ time, values: number[] }`. Points with an empty or
missing `values` array are treated as whitespace. The series' price line and
last-value label follow the column total.

Values are stacked from `base` (`0` by default): a positive value continues
away from the base, a negative one comes back towards it and past it, so a
mixed point stays contiguous and never overlaps. Values which are not finite
are skipped without shifting the segments above them.

A point may override the series colours for its own segments:

```js
series.setData([
    { time: '2024-04-22', values: [12, 8, 5] },
    { time: '2024-04-23', values: [14, 7, 6], colors: ['#000000', undefined, '#BBBBBB'] },
]);
```

Options can be changed at runtime with `series.applyOptions({ ... })`.

## Creating a series

Use `createStackedBarsSeries(chart, options?, paneIndex?)`. It returns the
normal series API, with the plugin's data and options types preserved. The helper
makes scaling options available before the first `setData` and rebuilds plot
values automatically when those options change through `series.applyOptions`.
This keeps autoscaling, last-value labels and crosshair values consistent. The
helper retains a shallow copy of the input data, including whitespace, and
re-ingests it only when a scaling option changes. Streaming updates remain
incremental.

The low-level `StackedBarsSeries` pane view remains available for integrations
that supply their own options getter to its constructor. Passing scaling options
only to `chart.addCustomSeries(new StackedBarsSeries(), options)` cannot make
them available before data ingestion on LWC 5.0; use the creation helper instead.

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `colors` | `string[]` | `['#2962FF', '#E1575A', '#F28E2C', 'rgb(164, 89, 209)', 'rgb(27, 156, 133)']` | Fill color of each segment, in stacking order. If there are more values than colors, the colors repeat. An empty array falls back to this default. |
| `base` | `number` | `0` | Price the columns are stacked from. |
| `columnWidthMode` | `'histogram' \| 'percent'` | `'histogram'` | `histogram` uses the width the built-in histogram series uses (as wide as the bar spacing allows, with a one pixel gap); `percent` uses a share of the bar spacing, given by `widthPercent`. |
| `widthPercent` | `number` | `80` | Column width as a percentage of the bar spacing, `0`–`100`. Only used when `columnWidthMode` is `percent`. |
| `segmentBorderColor` | `string` | `'#FFFFFF'` | Color of the border drawn inside the edge of every segment. |
| `segmentBorderWidth` | `number` | `0` | Width of the segment border in pixels. `0` draws no border. |
| `radius` | `number` | `0` | Corner radius of the two ends of a column, in pixels. |
| `stackOrder` | `'normal' \| 'reverse'` | `'normal'` | `normal` puts `values[0]` closest to the base; `reverse` puts the last value there. Colors stay with their value. |
| `percent` | `boolean` | `false` | Scale every point so that its segments total 100 in absolute terms, giving a 100% stacked chart. |

Per-point overrides, on the data item:

| Field | Type | Description |
| --- | --- | --- |
| `colors` | `(string \| undefined)[]` | Fill color of each segment of this point. A missing or `undefined` entry falls back to the series color for that segment. |

The standard `color` option is not used for the segments; it colors the
series' price line.

## Notes

- Column width follows the bar spacing by default, with a small gap between
  columns. Set `timeScale.minBarSpacing` (as in the example above) to keep
  columns from collapsing when the user zooms out, or switch to
  `columnWidthMode: 'percent'` for a fixed share of the slot.
- The price scale autoscales over the whole run of the stack, not just its
  total, so a column containing negative values stays fully in view.
- `createStackedBarsSeries` measures the same ordered, normalized, and offset
  bands that are drawn. `percent`, nonzero `base`, and `stackOrder: 'reverse'`
  therefore autoscale without a custom range provider.

- On `lightweight-charts` 5.1 and later the series reports the hovered segment
  through `hitTest` (the `objectId` is the index of the value within the point)
  and dims the other segments while one is hovered, and conflated points are
  merged by summing each band. On 5.0.0 those hooks are simply never called.
