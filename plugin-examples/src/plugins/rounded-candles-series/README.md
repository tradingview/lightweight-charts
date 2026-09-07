# Rounded candles series

A [custom candlestick series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series) with rounded candle bodies. It renders the same
open-high-low-close data as the built-in candlestick series. Each body is
drawn as a rounded rectangle. The corner radius adapts to the bar spacing:
sharp when zoomed out, soft when zoomed in.

Use it as a drop-in replacement for the built-in candlesticks wherever a
softer visual style fits, such as dashboards, embedded widgets, or marketing
pages.

## Installation

```shell
npm install @tradingview/lwc-plugin-rounded-candles-series
```

Requires Lightweight Charts™ `^5.2.0`.

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
built-in candlestick series. Points without a `close` are treated as
whitespace.

Options can be changed at runtime with `series.applyOptions({ ... })`.

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `upColor` | `string` | `'#26a69a'` | Body color of up candles. |
| `downColor` | `string` | `'#ef5350'` | Body color of down candles. |
| `wickUpColor` | `string` | `'#26a69a'` | Wick color of up candles. |
| `wickDownColor` | `string` | `'#ef5350'` | Wick color of down candles. |
| `radius` | `(barSpacing: number) => number` | `bs => bs < 4 ? 0 : bs / 3` | Corner radius of the candle body, in CSS pixels, computed from the current bar spacing. Return `0` for square candles. |

## Notes

- A candle counts as *up* when its close is greater than or equal to the
  **previous candle's close**, not its own open. This differs from the built-in
  candlestick series, which compares close with open.
- Wicks are always drawn, one pixel wide, in `wickUpColor` / `wickDownColor`.
- Rounded corners use `CanvasRenderingContext2D.roundRect`; in browsers without
  it the series falls back to square candles.
