# Pretty histogram series

A [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series) that draws a histogram with rounded bars. Unlike the built-in
histogram series, it can round the outer corners of each bar, control the bar
width as a share of the bar spacing, colour bars by their sign, draw a border
and fade the fill into a second colour. The result is a softer look that fits
dashboards and marketing-style charts.

Use it for volume panes, single-value indicators, or any bar chart where the
default square bars look too heavy.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-pretty-histogram-series
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { PrettyHistogramSeries } from '@tradingview/lwc-plugin-pretty-histogram-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new PrettyHistogramSeries(), {
    color: '#2962FF',
    widthPercent: 60,
    radius: 6,
});

series.setData([
    { time: '2024-04-22', value: 12.5 },
    { time: '2024-04-23', value: -4.1 },
    { time: '2024-04-24', value: 8.3, color: '#F23645' },
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
    "@tradingview/lwc-plugin-pretty-histogram-series": "https://unpkg.com/@tradingview/lwc-plugin-pretty-histogram-series/dist/pretty-histogram-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart } from 'lightweight-charts';
import { PrettyHistogramSeries } from '@tradingview/lwc-plugin-pretty-histogram-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new PrettyHistogramSeries(), {
    color: '#2962FF',
    widthPercent: 60,
    radius: 6,
});

series.setData([
    { time: '2024-04-22', value: 12.5 },
    { time: '2024-04-23', value: -4.1 },
    { time: '2024-04-24', value: 8.3, color: '#F23645' },
]);
</script>
```

## Usage

Add the series with `addCustomSeries`, then set histogram data:

```js
import { createChart } from 'lightweight-charts';
import { PrettyHistogramSeries } from '@tradingview/lwc-plugin-pretty-histogram-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new PrettyHistogramSeries(), {
    color: '#2962FF',
    widthPercent: 60,
    radius: 6,
});

series.setData([
    { time: '2024-04-22', value: 12.5 },
    { time: '2024-04-23', value: -4.1 },
    { time: '2024-04-24', value: 8.3, color: '#F23645' },
]);
```

Each data point is `{ time, value, color? }` — the same shape as the built-in
histogram series. A per-point `color` overrides the series `color` for that
bar. Points without a `value` are treated as whitespace.

Options can be changed at runtime with `series.applyOptions({ ... })`.

### Two-tone bars

Set `upColor` and `downColor` to colour each bar by its sign relative to
`base`, the way a volume pane usually does:

```js
series.applyOptions({
    base: 0,
    upColor: '#089981',
    downColor: '#F23645',
});
```

A per-point `color` still wins over both.

### The base line

Bars grow from `base` (`0` by default), and the base is always reported to the
autoscale alongside the values, exactly as the built-in histogram series does.
Bars are therefore never cut off at the edge of the pane, and no custom
`autoscaleInfoProvider` is needed.

`base` is read when the data is set, so change it before or together with
`setData` if you also rely on the autoscale following it.

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | `'#D63864'` | Fill color of the bars, used whenever no more specific color applies. A per-point `color` in the data overrides it. |
| `upColor` | `string \| null` | `null` | Fill color of bars at or above `base`. `null` falls back to `color`. |
| `downColor` | `string \| null` | `null` | Fill color of bars below `base`. `null` falls back to `color`. |
| `base` | `number` | `0` | Price the bars grow from. Always included in the autoscale. |
| `widthPercent` | `number` | `50` | Bar width as a percentage of the bar spacing, `0`–`100`. Ignored when `widthMode` is `'histogram'`. |
| `widthMode` | `'percent' \| 'histogram'` | `'percent'` | `'percent'` sizes each bar from `widthPercent`. `'histogram'` uses the full slot with a one-pixel gap, exactly as the built-in histogram series does. |
| `minColumnWidth` | `number` | `1` | Lower bound for the bar width, in CSS pixels. |
| `radius` | `number` | `4` | Corner radius of the bar's outer end, in CSS pixels. Positive bars are rounded at the top, negative bars at the bottom. The radius is capped at half the bar width and at the bar height. |
| `roundInnerCorners` | `boolean` | `false` | Whether the corners at the `base` end are rounded with the same radius. |
| `borderColor` | `string \| null` | `null` | Border color of the bars. `null` for no border. |
| `borderWidth` | `number` | `1` | Border width in CSS pixels. Only drawn when `borderColor` is set. |
| `gradientColor` | `string \| null` | `null` | Color the fill fades into at the outer end of each bar. `null` for a flat fill. |
| `highlightHovered` | `boolean` | `false` | Whether hovering the series fades every bar except the one under the cursor. Requires Lightweight Charts 5.1 or later. |

## Notes

- Bars are anchored at `base` and the base is always part of the autoscale, so
  the series behaves like the built-in histogram; see
  [The base line](#the-base-line).
- Bar widths reproduce the built-in histogram exactly in `'histogram'` width
  mode and at `widthPercent: 100`: the same pixel grid, the same one-pixel gap,
  and no alignment carried across a whitespace gap.
- Flat, borderless bars are drawn in batches: consecutive bars of the same
  color are filled in one canvas operation. Setting `borderColor`,
  `gradientColor` or `highlightHovered` paints bar by bar instead.
- `hitTest` (which reports the hovered bar through the crosshair as
  `bar-<index>`) and `conflationReducer` are used by Lightweight Charts 5.1 and
  later. On 5.0 they are simply never called, and `highlightHovered` has no
  effect.
