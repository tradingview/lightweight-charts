# Dual range histogram series

A [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series) that draws columns above and below a zero line. At each time
point it can show up to two nested columns in each direction: an outer range
in a lighter color and an inner range in a darker color.

By default the columns are not sized in price units. The series has a fixed
height in pixels: the largest value gets the full height, and the other columns
are scaled relative to it. This makes the series a compact overlay. It sits on
the zero line of another series' price scale and does not disturb that scale.
Set `scaleMode: 'price'` to have the values read as prices and autoscale like
any other series instead.

Use it to show paired values around a center line. Typical examples: buy and
sell volume with an inner share of "aggressive" orders, bid and ask depth, or
inflows and outflows with a highlighted component. Any positive and negative
pair with a nested subset fits.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-dual-range-histogram-series
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { createDualRangeHistogramSeries } from '@tradingview/lwc-plugin-dual-range-histogram-series';

const chart = createChart(document.getElementById('container'));

const histogram = createDualRangeHistogramSeries(chart, {
    priceLineVisible: false,
    lastValueVisible: false,
});
histogram.setData([
    { time: '2024-04-22', values: [120, 45, -80, -30] },
    { time: '2024-04-23', values: [90, 60, -110, -20] },
    { time: '2024-04-24', values: [140, 35, -60, -40] },
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
    "@tradingview/lwc-plugin-dual-range-histogram-series": "https://unpkg.com/@tradingview/lwc-plugin-dual-range-histogram-series/dist/dual-range-histogram-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart } from 'lightweight-charts';
import { createDualRangeHistogramSeries } from '@tradingview/lwc-plugin-dual-range-histogram-series';

const chart = createChart(document.getElementById('container'));

const histogram = createDualRangeHistogramSeries(chart, {
    priceLineVisible: false,
    lastValueVisible: false,
});
histogram.setData([
    { time: '2024-04-22', values: [120, 45, -80, -30] },
    { time: '2024-04-23', values: [90, 60, -110, -20] },
    { time: '2024-04-24', values: [140, 35, -60, -40] },
]);
</script>
```

## Usage

Add the series with `addCustomSeries`, then set data with a `values` array per
point — positive values draw upward, negative values downward. The array is
`[upOuter, upInner, downOuter, downInner]`, which is also how the styling
options name their columns:

```js
import { createChart, BaselineSeries } from 'lightweight-charts';
import { createDualRangeHistogramSeries } from '@tradingview/lwc-plugin-dual-range-histogram-series';

const chart = createChart(document.getElementById('container'), {
    timeScale: { barSpacing: 21, minBarSpacing: 4 },
});

const histogram = createDualRangeHistogramSeries(chart, {
    priceLineVisible: false,
    lastValueVisible: false,
});
histogram.setData([
    { time: '2024-04-22', values: [120, 45, -80, -30] },
    { time: '2024-04-23', values: [90, 60, -110, -20] },
    { time: '2024-04-24', values: [140, 35, -60, -40] },
]);

// A main series sharing the price scale; the histogram sits on its zero line.
const baseline = chart.addSeries(BaselineSeries, {
    baseValue: { type: 'price', price: 0 },
});
baseline.setData(mainData);
```

Each data point is `{ time, values: number[], colors? }`. Points with an empty
or missing `values` array are treated as whitespace. A `colors` entry overrides
the series color for the column at the same position; an `undefined` entry
keeps the series color.

Colors and corner radii are set per column:

```js
histogram.applyOptions({
    colors: {
        upOuter: '#BBDEFB',
        upInner: '#1565C0',
        downOuter: '#FFE0B2',
        downInner: '#EF6C00',
    },
    borderRadius: { upOuter: 8, upInner: 4, downOuter: 8, downInner: 4 },
    borderColor: '#131722',
    borderWidth: 1,
});
```

### Keeping the histogram in view

In the default `pixels` scale mode the histogram is `maxHeight` pixels tall and
centered on `baseValue`. It does not report its values to the price scale, so
it never distorts the scaling of the main series — but if the base line is
close to the top or bottom of the pane, the columns are clipped. Reserve room
with `keepPixelSeriesInView`, which sets the price scale's margins and keeps
them correct while the chart is resized:

```js
import { keepPixelSeriesInView } from '@tradingview/lwc-plugin-dual-range-histogram-series';

const stop = keepPixelSeriesInView(chart, histogram);
// … later, before removing the chart:
stop();
```

The helper follows the series' current pane, including pane resizing and moves.
It uses a sizing primitive attached to the series; call `stop()` before removing
the chart. Calling `stop()` more than once is safe.

Pass a height as the third argument to reserve room for something other than
the series' own `maxHeight`.

### Scale modes

`scaleMode: 'price'` treats the values as prices measured from `baseValue`, so
the columns are autoscaled by the price scale like any other series;
`maxHeight` and `normalize` are then ignored and no margins need reserving.

`createDualRangeHistogramSeries` keeps the plot values synchronized with
`scaleMode` and `baseValue`, including changes made through `applyOptions`.

In `pixels` mode, `normalize` chooses what the heights are scaled against:
`'visible'` (the default) rescales the columns as you pan, `'all'` keeps their
relative heights across the whole data set, and a number fixes the value which
fills half of `maxHeight`.

Options can be changed at runtime with `series.applyOptions({ ... })`.

## Creating a series

Use `createDualRangeHistogramSeries(chart, options?, paneIndex?)`. It returns the
normal series API, with the plugin's data and options types preserved. The helper
makes scaling options available before the first `setData` and rebuilds plot
values automatically when those options change through `series.applyOptions`.
This keeps autoscaling, last-value labels and crosshair values consistent. The
helper retains a shallow copy of the input data, including whitespace, and
re-ingests it only when a scaling option changes. Streaming updates remain
incremental.

The low-level `DualRangeHistogramSeries` pane view remains available for integrations
that supply their own options getter to its constructor. Passing scaling options
only to `chart.addCustomSeries(new DualRangeHistogramSeries(), options)` cannot make
them available before data ingestion on LWC 5.0; use the creation helper instead.

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `colors` | `{ upOuter, upInner, downOuter, downInner }` of `string` | `{ upOuter: '#ACE5DC', upInner: '#42BDA8', downOuter: '#FCCACD', downInner: '#F77C80' }` | Fill color of each column. A per-point `colors` entry overrides it. |
| `borderRadius` | `{ upOuter, upInner, downOuter, downInner }` of `number` | `{ upOuter: 2, upInner: 0, downOuter: 2, downInner: 0 }` | Corner radius of each column, in CSS pixels, applied to the column's outer end. |
| `borderColor` | `string \| null` | `null` | Border color of the columns. `null` for no border. |
| `borderWidth` | `number` | `1` | Border width in CSS pixels. Only drawn when `borderColor` is set. |
| `maxHeight` | `number` | `130` | Total height of the histogram in CSS pixels; the largest value reaches half of it above or below the base line. `pixels` scale mode only. |
| `scaleMode` | `'pixels' \| 'price'` | `'pixels'` | Whether the column heights are a fixed number of pixels or prices measured from `baseValue`. See [Scale modes](#scale-modes). |
| `normalize` | `'visible' \| 'all' \| number` | `'visible'` | What the heights are scaled against in `pixels` mode: the largest value in the visible range, in the whole data set, or a fixed value. |
| `gap` | `number` | `0` | Gap between the upward and the downward half, in CSS pixels. |
| `widthPercent` | `number` | `100` | Column width as a percentage of the bar spacing, `0`–`100`. |
| `baseValue` | `number` | `0` | Price the columns are centered on. |
| `highlightHovered` | `boolean` | `false` | Whether hovering the series fades every point except the one under the cursor. Requires Lightweight Charts 5.1 or later. |

## Notes

- Columns are matched to `colors` and `borderRadius` by their **position** in
  `values`, not by their sign: a negative value in the `upOuter` slot points
  downwards but is still drawn in the `upOuter` color.
- Columns for the same point share one width and position; values are drawn in
  array order, so later (inner) values paint over earlier (outer) ones. Keep
  inner values smaller than outer ones for the nested look.
- A point may carry more than four values; the four columns then repeat, so
  `values[4]` is styled as `upOuter` again.
- Column widths follow the same pixel grid as the built-in histogram series,
  and the alignment is not carried across a gap of whitespace.
- Values which are not finite are skipped, and nothing is drawn when there is
  no value to scale the columns against (an all-zero data set, say).
- `hitTest` (which reports the hovered point through the crosshair as
  `bar-<index>`) and `conflationReducer` are used by Lightweight Charts 5.1 and
  later. On 5.0 they are simply never called, and `highlightHovered` has no
  effect.
