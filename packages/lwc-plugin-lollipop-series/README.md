# Lollipop series

A [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series)
that draws each value as a dot at the end of a stem. The stem runs from a
base line, `0` by default, up to a value above it or down to a value below it.

Use it where a histogram would put too much ink on the chart: values that
swing around a reference, such as daily returns, net flows or a difference
from a target, where the dot marks the value and the stem shows how far it is
from the base.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-lollipop-series
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { createLollipopSeries } from '@tradingview/lwc-plugin-lollipop-series';

const chart = createChart(document.getElementById('container'));
const series = createLollipopSeries(chart, { color: '#2962FF' });

series.setData([
    { time: '2024-04-22', value: 4.2 },
    { time: '2024-04-23', value: -1.8 },
    { time: '2024-04-24', value: 2.6 },
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
    "@tradingview/lwc-plugin-lollipop-series": "https://unpkg.com/@tradingview/lwc-plugin-lollipop-series/dist/lollipop-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart } from 'lightweight-charts';
import { createLollipopSeries } from '@tradingview/lwc-plugin-lollipop-series';

const chart = createChart(document.getElementById('container'));
const series = createLollipopSeries(chart, { color: '#2962FF' });

series.setData([
    { time: '2024-04-22', value: 4.2 },
    { time: '2024-04-23', value: -1.8 },
    { time: '2024-04-24', value: 2.6 },
]);
</script>
```

## Usage

Add the series with `createLollipopSeries`, then set data with a `value` per
point:

```js
import { createChart } from 'lightweight-charts';
import { createLollipopSeries } from '@tradingview/lwc-plugin-lollipop-series';

const chart = createChart(document.getElementById('container'));
const series = createLollipopSeries(chart, {
    base: 0,
    lineWidth: 2,
    markerSize: 8,
});

series.setData([
    { time: '2024-04-22', value: 4.2 },
    { time: '2024-04-23', value: -1.8, color: '#F23645' },
    { time: '2024-04-24' },
    { time: '2024-04-25', value: 2.6 },
]);
```

Each data point is `{ time, value }`. A point without a finite `value`,
`null` included, as JSON sends a missing one, is whitespace: it keeps its
place on the time scale and draws nothing. A `color` on a point
overrides the series `color` for that point's stem and dot.

The series' price line and last value label follow the last value. Options can
be changed at runtime with `series.applyOptions({ ... })`.

## Creating a series

Use `createLollipopSeries(chart, options?, paneIndex?)`. It returns the normal
series API, with the plugin's data and options types preserved. It makes `base`
available to the series before the first `setData`, so the base line is part
of the autoscale range from the start, and changing `base` through
`series.applyOptions` rescales the series without setting the data again. The
helper keeps a shallow copy of the input data for that purpose; streaming
updates stay incremental.

The `LollipopSeries` class remains available for
`chart.addCustomSeries(new LollipopSeries(), options)`. Added that way, the
series only learns its options at the first render, so the data set before
then is scaled as if `base` were `0`: values around 100 with `base: 100` are
stretched down to 0 until the data is set again.

## Options

In addition to the standard
[series options](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon)
(`color`, `priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `base` | `number` | `0` | Price the stems are drawn from. It is part of the autoscale range, so the base line always stays in view. |
| `lineWidth` | `number` | `2` | Width of the stem, in CSS pixels, at most half the bar spacing and at least one device pixel. |
| `markerSize` | `number` | `8` | Diameter of the dot at the value, in CSS pixels, at most 20 and at most the bar spacing. `0` draws no dots. |

The standard `color` option colors the stems, the dots and the price line.

## Notes

- Stems and dots shrink with the bar spacing when the chart is zoomed out: a
  stem is at most half the bar spacing wide, down to one device pixel, and a
  dot at most as wide as the bar spacing, so neighboring dots can touch but
  stay apart from the next stem. At a bar spacing of one device pixel the
  one-pixel stems fill every pixel. Set `timeScale.minBarSpacing` to keep
  lollipops from getting that small.
- Autoscale covers the values and the base, not the dots around them, so a
  dot at the highest or lowest value sticks out by its radius. The 20 px cap
  on `markerSize` keeps it within the price scale's default margins in a pane
  at least 100 px tall.
- Only the points on screen are drawn. The series is never conflated: with
  `timeScale.enableConflation` on, the chart still draws every point.
- On `lightweight-charts` 5.2 and later the series reports the lollipop under
  the pointer through `hitTest`, within the series' `hitTestTolerance` (3 px
  by default): the crosshair event's `hoveredInfo.objectId` is `bar-<index>`,
  where `<index>` is the point's position in `series.data()`. The dot is
  reported as a point and the stem as a range, like a column, so a candle body
  the pointer is inside wins over a stem the pointer is only near. Elsewhere
  in a point's slot, between the base and the value, the chart's own fallback
  still reports the series as hovered, without an `objectId`. Older versions
  never call `hitTest`.
