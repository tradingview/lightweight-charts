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
import { createStackedAreaSeries } from '@tradingview/lwc-plugin-stacked-area-series';

const chart = createChart(document.getElementById('container'), {
    rightPriceScale: { scaleMargins: { top: 0.05, bottom: 0.05 } },
});
const series = createStackedAreaSeries(chart, {
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
import { createStackedAreaSeries } from '@tradingview/lwc-plugin-stacked-area-series';

const chart = createChart(document.getElementById('container'), {
    rightPriceScale: { scaleMargins: { top: 0.05, bottom: 0.05 } },
});
const series = createStackedAreaSeries(chart, {
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

Add the series with `createStackedAreaSeries`, then set data with a `values` array per
point. The array order is the stacking order: `values[0]` is the bottom band.

```js
import { createChart } from 'lightweight-charts';
import { createStackedAreaSeries } from '@tradingview/lwc-plugin-stacked-area-series';

const chart = createChart(document.getElementById('container'), {
    rightPriceScale: { scaleMargins: { top: 0.05, bottom: 0.05 } },
});
const series = createStackedAreaSeries(chart, {
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

Each data point is `{ time, values: number[] }`. Points do not have to carry
the same number of values: a point with fewer values is padded with zeroes, so
its missing bands collapse onto the one below them. Points with an empty or
missing `values` array are treated as whitespace. The series' price line and
last-value label follow the stack total.

Values are stacked from `base` (`0` by default): a positive value continues
away from the base, a negative one comes back towards it and past it, so each
band is a single ribbon between two lines and never folds over itself.

A point may override the colours of its own bands:

```js
series.setData([
    { time: '2024-04-22', values: [12, 8, 5] },
    {
        time: '2024-04-23',
        values: [14, 7, 6],
        colors: [{ line: '#000000', area: 'rgba(0, 0, 0, 0.2)' }],
    },
]);
```

An override applies to the piece of the band which starts at that point.

Options can be changed at runtime with `series.applyOptions({ ... })`.

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `colors` | `StackedAreaColor[]` | five preset pairs (blue, red, orange, purple, teal); in each pair the area is the line color at 20% opacity | Appearance of each band, in stacking order. If there are more values than entries, the entries repeat. An empty array falls back to this default. |
| `lineWidth` | `LineWidth` | `2` | Width of the band lines, in CSS pixels (`1`–`4`). |
| `lineStyle` | `LineStyle` | `LineStyle.Solid` | Style of the band lines. |
| `lineVisible` | `boolean` | `true` | Whether the band lines are drawn. |
| `areaVisible` | `boolean` | `true` | Whether the bands are filled. |
| `base` | `number` | `0` | Price the bands are stacked from. |
| `lineType` | `'simple' \| 'step' \| 'curved'` | `'simple'` | How the points of a band are joined: straight lines, a value held until the next point, or a smooth curve. |
| `gapHandling` | `'break' \| 'bridge'` | `'break'` | Whether the bands stop at a whitespace gap and start again after it, or are drawn straight across it. |
| `percent` | `boolean` | `false` | Scale every point so that its bands total 100 in absolute terms, giving a 100% stacked chart. |

Each entry of `colors` is a `StackedAreaColor`, which may also override the
series-wide line options for that band:

| Field | Type | Description |
| --- | --- | --- |
| `line` | `string` | Color of the line along the top of the band. |
| `area` | `string` | Fill color of the band, or the top of its gradient when `areaBottom` is set. |
| `areaBottom` | `string` (optional) | Bottom color of the band's gradient. |
| `lineWidth` | `LineWidth` (optional) | Width of this band's line. |
| `lineStyle` | `LineStyle` (optional) | Style of this band's line. |
| `lineVisible` | `boolean` (optional) | Whether this band's line is drawn. |
| `areaVisible` | `boolean` (optional) | Whether this band is filled. |

Per-point overrides, on the data item:

| Field | Type | Description |
| --- | --- | --- |
| `colors` | `StackedAreaPointColor[]` | `line`, `area` and `areaBottom` for each band at this point. Anything missing falls back to the series color. |

## Notes

- The price scale autoscales over the whole run of the stack, not just its
  total, so a point containing negative values stays fully in view. The
  outermost line sits exactly on the edge of the range; add a small
  `scaleMargins` on the price scale (as in the example above) if you want
  breathing room around it.
- Autoscaling is computed from the raw `values` measured from zero, because the
  library asks for those values before the series options are known. With
  `percent: true`, or a `base` other than `0`, supply the range yourself:

  ```js
  series.applyOptions({
      percent: true,
      autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }),
  });
  ```

- The factory retains explicit whitespace, and `gapHandling` decides whether
  to break or bridge it. Timestamps from other series do not create gaps.
- On `lightweight-charts` 5.1 and later the series reports the hovered band
  through `hitTest` (the `objectId` is the index of the band) and dims the
  other bands while one is hovered, and conflated points are merged by summing
  each band. On 5.0.0 those hooks are simply never called.

### Explicit whitespace

Use `createStackedAreaSeries` to retain whitespace passed through `setData` and
`update`, including historical corrections. Other series' timestamps do not
break the area. The low-level `StackedAreaSeries` view remains available, but
without the factory's gap predicate it draws continuously: the host does not
provide whitespace to custom renderers.
