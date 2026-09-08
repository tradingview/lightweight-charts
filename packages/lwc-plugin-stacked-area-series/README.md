# Stacked area series

A [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series) that stacks several values per
time point into cumulative
bands. Each value is drawn as an area on top of the previous one, with a line
along its upper edge. The top edge of the stack shows the total.

Use it to show composition over time, when the parts and the whole matter at
the same time. Typical examples: portfolio allocation, revenue by segment,
traffic by source, or volume by venue.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-stacked-area-series
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { StackedAreaSeries } from '@tradingview/lwc-plugin-stacked-area-series';

const chart = createChart(document.getElementById('container'), {
    rightPriceScale: { scaleMargins: { top: 0.05, bottom: 0.05 } },
});
const series = chart.addCustomSeries(new StackedAreaSeries(), {
    colors: [
        { line: '#2962FF', area: 'rgba(41, 98, 255, 0.2)' },
        { line: '#F23645', area: 'rgba(242, 54, 69, 0.2)' },
        { line: '#FF9800', area: 'rgba(255, 152, 0, 0.2)' },
    ],
    lineWidth: 2,
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
    "@tradingview/lwc-plugin-stacked-area-series": "https://unpkg.com/@tradingview/lwc-plugin-stacked-area-series/dist/stacked-area-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart } from 'lightweight-charts';
import { StackedAreaSeries } from '@tradingview/lwc-plugin-stacked-area-series';

const chart = createChart(document.getElementById('container'), {
    rightPriceScale: { scaleMargins: { top: 0.05, bottom: 0.05 } },
});
const series = chart.addCustomSeries(new StackedAreaSeries(), {
    colors: [
        { line: '#2962FF', area: 'rgba(41, 98, 255, 0.2)' },
        { line: '#F23645', area: 'rgba(242, 54, 69, 0.2)' },
        { line: '#FF9800', area: 'rgba(255, 152, 0, 0.2)' },
    ],
    lineWidth: 2,
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
point. The array order is the stacking order: `values[0]` is the bottom band.

```js
import { createChart } from 'lightweight-charts';
import { StackedAreaSeries } from '@tradingview/lwc-plugin-stacked-area-series';

const chart = createChart(document.getElementById('container'), {
    rightPriceScale: { scaleMargins: { top: 0.05, bottom: 0.05 } },
});
const series = chart.addCustomSeries(new StackedAreaSeries(), {
    colors: [
        { line: '#2962FF', area: 'rgba(41, 98, 255, 0.2)' },
        { line: '#F23645', area: 'rgba(242, 54, 69, 0.2)' },
        { line: '#FF9800', area: 'rgba(255, 152, 0, 0.2)' },
    ],
    lineWidth: 2,
});

series.setData([
    { time: '2024-04-22', values: [12, 8, 5] },
    { time: '2024-04-23', values: [14, 7, 6] },
    { time: '2024-04-24', values: [11, 9, 4] },
]);
```

Each data point is `{ time, values: number[] }`. Every point should carry the
same number of values. Points with an empty or missing `values` array are
treated as whitespace. The series' price line and last-value label follow the
stack total.

Options can be changed at runtime with `series.applyOptions({ ... })`.

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `colors` | `{ line: string; area: string }[]` | five preset pairs (blue, red, orange, purple, teal); in each pair the area is the line color at 20% opacity | Line and fill color for each band, in stacking order. If there are more values than colors, the colors repeat. |
| `lineWidth` | `number` | `2` | Width of the band lines, in CSS pixels. |

## Notes

- The price scale autoscales from `0` to the stack total, so the whole stack is
  always in view. The top line sits exactly on the edge of the range; add a
  small `scaleMargins.top` on the price scale (as in the example above) if you
  want breathing room above it.
- Negative values are stacked arithmetically and will overlap the bands below
  them; the series is designed for non-negative parts of a whole.
