# Rounded candles series

A [custom candlestick series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series) with rounded candle bodies. It renders the same
open-high-low-close data as the built-in candlestick series. Each body is
drawn as a rounded rectangle. The corner radius adapts to the bar spacing:
sharp when zoomed out, soft when zoomed in.

Use it as a drop-in replacement for the built-in candlesticks wherever a
softer visual style fits, such as dashboards, embedded widgets, or marketing
pages.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-rounded-candles-series
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { RoundedCandleSeries } from '@tradingview/lwc-plugin-rounded-candles-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new RoundedCandleSeries(), {
    upColor: '#089981',
    downColor: '#F23645',
    wickUpColor: '#089981',
    wickDownColor: '#F23645',
});

series.setData([
    { time: '2024-04-22', open: 100.2, high: 104.6, low: 99.1, close: 103.8 },
    { time: '2024-04-23', open: 103.8, high: 105.0, low: 101.4, close: 102.0 },
    { time: '2024-04-24', open: 102.0, high: 106.1, low: 101.7, close: 105.4 },
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
    "@tradingview/lwc-plugin-rounded-candles-series": "https://unpkg.com/@tradingview/lwc-plugin-rounded-candles-series/dist/rounded-candles-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart } from 'lightweight-charts';
import { RoundedCandleSeries } from '@tradingview/lwc-plugin-rounded-candles-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new RoundedCandleSeries(), {
    upColor: '#089981',
    downColor: '#F23645',
    wickUpColor: '#089981',
    wickDownColor: '#F23645',
});

series.setData([
    { time: '2024-04-22', open: 100.2, high: 104.6, low: 99.1, close: 103.8 },
    { time: '2024-04-23', open: 103.8, high: 105.0, low: 101.4, close: 102.0 },
    { time: '2024-04-24', open: 102.0, high: 106.1, low: 101.7, close: 105.4 },
]);
</script>
```

## Usage

Add the series with `addCustomSeries`, then set candlestick data:

```js
import { createChart } from 'lightweight-charts';
import { RoundedCandleSeries } from '@tradingview/lwc-plugin-rounded-candles-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new RoundedCandleSeries(), {
    upColor: '#089981',
    downColor: '#F23645',
    wickUpColor: '#089981',
    wickDownColor: '#F23645',
});

series.setData([
    { time: '2024-04-22', open: 100.2, high: 104.6, low: 99.1, close: 103.8 },
    { time: '2024-04-23', open: 103.8, high: 105.0, low: 101.4, close: 102.0 },
    { time: '2024-04-24', open: 102.0, high: 106.1, low: 101.7, close: 105.4 },
]);
```

Each data point is `{ time, open, high, low, close }` — the same shape as the
built-in candlestick series. Points missing any of the four values are treated
as whitespace, and leave a gap.

A constant `radius` fixes the corner rounding regardless of zoom:

```js
series.applyOptions({ radius: 6 });
```

Options can be changed at runtime with `series.applyOptions({ ... })`.

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `upColor` | `string` | `'#26a69a'` | Body color of rising candles. |
| `downColor` | `string` | `'#ef5350'` | Body color of falling candles. |
| `borderVisible` | `boolean` | `true` | Whether a border is drawn around the body. |
| `borderUpColor` | `string` | `'#26a69a'` | Border color of rising candles. |
| `borderDownColor` | `string` | `'#ef5350'` | Border color of falling candles. |
| `borderColor` | `string` | — | Border color of both directions. Wins over `borderUpColor` / `borderDownColor` while it is set to a non-empty string. |
| `wickVisible` | `boolean` | `true` | Whether wicks are drawn. |
| `wickUpColor` | `string` | `'#26a69a'` | Wick color of rising candles. |
| `wickDownColor` | `string` | `'#ef5350'` | Wick color of falling candles. |
| `wickColor` | `string` | — | Wick color of both directions. Wins over `wickUpColor` / `wickDownColor` while it is set to a non-empty string. |
| `wickLineCap` | `'butt' \| 'round'` | `'butt'` | Shape of the two wick ends. |
| `radius` | `number \| ((barSpacing: number) => number)` | `bs => bs < 4 ? 0 : bs / 3` | Corner radius of the candle body, in CSS pixels. Either a constant, or a function of the current bar spacing. Use `0` for square candles. |
| `upDownMode` | `'openClose' \| 'previousClose'` | `'openClose'` | How a candle is decided to be rising or falling. `'openClose'` compares `open <= close`, exactly as the built-in candlestick series does. `'previousClose'` compares the close with the previous candle's close and treats the first candle as rising. |
| `hoverDimOpacity` | `number` | `1` | Opacity of the candles other than the hovered one while the series is hovered. `1` leaves the series unchanged. |

Each data point may also carry `color`, `borderColor` and `wickColor`, which
override the corresponding options for that candle only — the same per-item
overrides the built-in candlestick series supports.

## Notes

- A candle counts as *rising* when `open <= close`, exactly as the built-in
  candlestick series decides it. `upDownMode: 'previousClose'` restores the
  behaviour this plugin had while it was an example (close compared with the
  previous close, the first candle always rising).
- `borderColor` and `wickColor` are resolved at draw time, so clearing them
  (setting them to an empty string) brings the up/down pair back. The built-in
  series copies them into the pair once, in `applyOptions`, and cannot be
  reverted that way.
- Wicks are drawn above and below the body rather than as one bar behind it, so
  a translucent body does not show its own wick through itself.
- On hosts that support them (Lightweight Charts™ 5.1 and later) the series
  reports the candle under the cursor through `hitTest`, and conflated candles
  are merged open-first, close-last with the extremes of both.
- Rounded corners use `CanvasRenderingContext2D.roundRect`, which every browser
  the library supports provides.
