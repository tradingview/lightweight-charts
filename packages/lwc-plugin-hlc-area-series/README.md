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
import { HLCAreaSeries } from '@tradingview/lwc-plugin-hlc-area-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new HLCAreaSeries(), {
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
import { HLCAreaSeries } from '@tradingview/lwc-plugin-hlc-area-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new HLCAreaSeries(), {
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

Add the series with `addCustomSeries`, then set data with `high`, `low`, and
`close` values:

```js
import { createChart } from 'lightweight-charts';
import { HLCAreaSeries } from '@tradingview/lwc-plugin-hlc-area-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new HLCAreaSeries(), {
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

Each data point is `{ time, high, low, close }`. Points without a `close` are
treated as whitespace. The series' price line and last-value label follow the
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
| `areaTopColor` | `string` | `'rgba(4, 153, 129, 0.2)'` | Fill color between the high line and the close line. |
| `areaBottomColor` | `string` | `'rgba(242, 54, 69, 0.2)'` | Fill color between the close line and the low line. |
| `highLineWidth` | `number` | `2` | Width of the high line, in CSS pixels. |
| `lowLineWidth` | `number` | `2` | Width of the low line, in CSS pixels. |
| `closeLineWidth` | `number` | `2` | Width of the close line, in CSS pixels. |

## Notes

- The price scale autoscales to the full `low`–`high` range, so the band is
  never clipped.
- To hide a line, set its width to `0`; to hide a fill, use a transparent color.
