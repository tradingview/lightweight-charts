# HLC area series

A [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series) for high-low-close data. It draws the high, low, and close
values as three lines. The band between the lines is filled with two colors:
one between high and close, another between close and low. The result reads
like a candlestick's range without the visual weight of individual candles.

Use it to show a value together with its range over time. Typical examples: a
daily close between its high and low, a forecast with its confidence band, the
minimum, average, and maximum of a metric, or a mid price between bid and ask.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-hlc-area-series
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { createHLCAreaSeries } from '@tradingview/lwc-plugin-hlc-area-series';

const chart = createChart(document.getElementById('container'));
const series = createHLCAreaSeries(chart, {
    highLineColor: '#089981',
    lowLineColor: '#F23645',
    closeLineColor: '#787B86',
});

series.setData([
    { time: '2024-04-22', high: 104.2, low: 98.7, close: 101.3 },
    { time: '2024-04-23', high: 105.0, low: 100.1, close: 104.6 },
    { time: '2024-04-24', high: 106.8, low: 103.2, close: 103.9 },
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
    "@tradingview/lwc-plugin-hlc-area-series": "https://unpkg.com/@tradingview/lwc-plugin-hlc-area-series/dist/hlc-area-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart } from 'lightweight-charts';
import { createHLCAreaSeries } from '@tradingview/lwc-plugin-hlc-area-series';

const chart = createChart(document.getElementById('container'));
const series = createHLCAreaSeries(chart, {
    highLineColor: '#089981',
    lowLineColor: '#F23645',
    closeLineColor: '#787B86',
});

series.setData([
    { time: '2024-04-22', high: 104.2, low: 98.7, close: 101.3 },
    { time: '2024-04-23', high: 105.0, low: 100.1, close: 104.6 },
    { time: '2024-04-24', high: 106.8, low: 103.2, close: 103.9 },
]);
</script>
```

## Usage

Add the series with `createHLCAreaSeries`, then set data with `high`, `low`, and
`close` values:

```js
import { createChart } from 'lightweight-charts';
import { createHLCAreaSeries } from '@tradingview/lwc-plugin-hlc-area-series';

const chart = createChart(document.getElementById('container'));
const series = createHLCAreaSeries(chart, {
    highLineColor: '#089981',
    lowLineColor: '#F23645',
    closeLineColor: '#787B86',
});

series.setData([
    { time: '2024-04-22', high: 104.2, low: 98.7, close: 101.3 },
    { time: '2024-04-23', high: 105.0, low: 100.1, close: 104.6 },
    { time: '2024-04-24', high: 106.8, low: 103.2, close: 103.9 },
]);
```

Each data point is `{ time, high, low, close }`. Points missing any of the three
values are treated as whitespace, and leave a gap. The series' price line and last-value label follow the
`close` value.

Options can be changed at runtime with `series.applyOptions({ ... })`.

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `highLineColor` | `string` | `'#049981'` | Color of the high line. |
| `lowLineColor` | `string` | `'#F23645'` | Color of the low line. |
| `closeLineColor` | `string` | `'#878993'` | Color of the close line. |
| `highAreaColor` | `string` | `'rgba(4, 153, 129, 0.2)'` | Fill color between the high line and the close line. |
| `lowAreaColor` | `string` | `'rgba(242, 54, 69, 0.2)'` | Fill color between the close line and the low line. |
| `highLineWidth` | `LineWidth` | `2` | Width of the high line, in CSS pixels (`1`–`4`). |
| `lowLineWidth` | `LineWidth` | `2` | Width of the low line, in CSS pixels (`1`–`4`). |
| `closeLineWidth` | `LineWidth` | `2` | Width of the close line, in CSS pixels (`1`–`4`). |
| `highLineStyle` | `LineStyle` | `LineStyle.Solid` | Dash pattern of the high line. |
| `lowLineStyle` | `LineStyle` | `LineStyle.Solid` | Dash pattern of the low line. |
| `closeLineStyle` | `LineStyle` | `LineStyle.Solid` | Dash pattern of the close line. |
| `highLineVisible` | `boolean` | `true` | Whether the high line is drawn. |
| `lowLineVisible` | `boolean` | `true` | Whether the low line is drawn. |
| `closeLineVisible` | `boolean` | `true` | Whether the close line is drawn. |
| `areaVisible` | `boolean` | `true` | Whether the two fills between the lines are drawn. |
| `lineType` | `'simple' \| 'step'` | `'simple'` | How the lines and the fills get from one point to the next. `'step'` matches the built-in `LineType.WithSteps`. |
| `highAreaTopColor` | `string` | `''` | Upper stop of a vertical gradient filling the high–close band. |
| `highAreaBottomColor` | `string` | `''` | Lower stop of the high–close band gradient. |
| `lowAreaTopColor` | `string` | `''` | Upper stop of a vertical gradient filling the close–low band. |
| `lowAreaBottomColor` | `string` | `''` | Lower stop of the close–low band gradient. |
| `hoverPointRadius` | `number` | `4` | Radius, in CSS pixels, of the dots drawn on the high, low and close of the bar under the cursor while the series is hovered. `0` turns the highlight off. |

`areaTopColor` and `areaBottomColor` are deprecated aliases of `highAreaColor`
and `lowAreaColor`. They still work, and take precedence when both are set.

A band is filled with a gradient only when both stops of its pair are set; while
either is an empty string the flat `highAreaColor` / `lowAreaColor` is used. The
gradient runs down the whole pane, like the built-in Area series' `topColor` and
`bottomColor` without `relativeGradient`.

## Notes

- The price scale autoscales to the full `low`–`high` range, so the band is
  never clipped.
- Points missing any of `high`, `low` and `close` are whitespace. The lines and
  the fills break at a run of whitespace instead of bridging it, and a point
  whose price falls off the scale is skipped rather than turned into a NaN
  coordinate.
- The lines and the fills continue past the first and the last visible point, so
  they reach the edges of the pane while panning.
- Line widths follow the library's `LineWidth` type, so `0` is not one of them.
  Use `highLineVisible` / `lowLineVisible` / `closeLineVisible` to hide a line
  and `areaVisible` to hide both fills.
- On hosts that support them (Lightweight Charts™ 5.1 and later) the series
  reports the bar under the cursor through `hitTest` and highlights its three
  values, and conflated points are merged as the highest high, the lowest low
  and the last close.

### Explicit whitespace

Use `createHLCAreaSeries` to retain whitespace passed through `setData` and
`update`, including historical corrections. Other series' timestamps do not
break the area. The low-level `HLCAreaSeries` view remains available, but
without the factory's gap predicate it draws continuously: the host does not
provide whitespace to custom renderers.
