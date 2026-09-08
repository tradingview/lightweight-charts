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
import { StackedBarsSeries } from '@tradingview/lwc-plugin-stacked-bars-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new StackedBarsSeries(), {
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
import { StackedBarsSeries } from '@tradingview/lwc-plugin-stacked-bars-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new StackedBarsSeries(), {
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
import { StackedBarsSeries } from '@tradingview/lwc-plugin-stacked-bars-series';

const chart = createChart(document.getElementById('container'), {
    timeScale: { minBarSpacing: 3 },
});
const series = chart.addCustomSeries(new StackedBarsSeries(), {
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

Options can be changed at runtime with `series.applyOptions({ ... })`.

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `colors` | `string[]` | `['#2962FF', '#E1575A', '#F28E2C', 'rgb(164, 89, 209)', 'rgb(27, 156, 133)']` | Fill color of each segment, in stacking order. If there are more values than colors, the colors repeat. |

The standard `color` option is not used for the segments; it colors the
series' price line.

## Notes

- Column width follows the bar spacing, with a small gap between columns; there
  is no separate width option. Set `timeScale.minBarSpacing` (as in the example
  above) to keep columns from collapsing when the user zooms out.
- The price scale autoscales from `0` to the column total, so the whole column
  is always in view.
- Negative values are stacked arithmetically and will overlap the segments
  below them; the series is designed for non-negative parts of a whole.
