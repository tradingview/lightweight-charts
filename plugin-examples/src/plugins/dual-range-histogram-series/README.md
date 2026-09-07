# Dual range histogram series

A [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series) that draws columns above and below a zero line. At each time
point it can show up to two nested columns in each direction: an outer range
in a lighter color and an inner range in a darker color.

Unlike a regular histogram, the columns are not sized in price units. The
series has a fixed height in pixels: the largest visible value gets the full
height, and the other columns are scaled relative to it. This makes the
series a compact overlay. It sits on the zero line of another series' price
scale and does not disturb that scale.

Use it to show paired values around a center line. Typical examples: buy and
sell volume with an inner share of "aggressive" orders, bid and ask depth, or
inflows and outflows with a highlighted component. Any positive and negative
pair with a nested subset fits.

## Installation

```shell
npm install @tradingview/lwc-plugin-dual-range-histogram-series
```

Requires Lightweight Charts™ `^5.2.0`.

## Usage

Add the series with `addCustomSeries`, then set data with a `values` array per
point — positive values draw upward, negative values downward. The conventional
layout is `[outerUp, innerUp, outerDown, innerDown]`:

```js
import { createChart, BaselineSeries } from 'lightweight-charts';
import { DualRangeHistogramSeries } from '@tradingview/lwc-plugin-dual-range-histogram-series';

const chart = createChart(document.getElementById('container'), {
    timeScale: { barSpacing: 21, minBarSpacing: 4 },
});

const histogram = chart.addCustomSeries(new DualRangeHistogramSeries(), {
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

Each data point is `{ time, values: number[] }`. Points with an empty or
missing `values` array are treated as whitespace.

### Keeping the histogram in view

The histogram is `maxHeight` pixels tall and centered on the zero line. It
does not report its values to the price scale, so it never distorts the
scaling of the main series. If the zero line is close to the top or bottom of the pane,
the columns are clipped. Reserve room with the price scale's margins, and
recompute them when the chart resizes:

```js
function fitHistogram() {
    const { height } = chart.paneSize();
    const margin = Math.min(0.3, histogram.options().maxHeight / 2 / height);
    histogram.priceScale().applyOptions({ scaleMargins: { top: margin, bottom: margin } });
}
new ResizeObserver(fitHistogram).observe(chart.chartElement());
fitHistogram();
```

Options can be changed at runtime with `series.applyOptions({ ... })`.

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `colors` | `string[]` | `['#ACE5DC', '#42BDA8', '#FCCACD', '#F77C80']` | Fill color for each value by index (outer up, inner up, outer down, inner down). If there are more values than colors, the colors repeat. |
| `borderRadius` | `number[]` | `[2, 0, 2, 0]` | Corner radius for each value by index, in CSS pixels, applied to the column's outer end. |
| `maxHeight` | `number` | `130` | Total height of the histogram in CSS pixels; the largest visible value reaches half of it above or below the zero line. |

## Notes

- Values are normalized against the largest absolute value in the **visible**
  range, so column heights change as the user scrolls or zooms.
- Columns for the same point share one width and position; values are drawn in
  array order, so later (inner) values paint over earlier (outer) ones. Keep
  inner values smaller than outer ones for the nested look.
- Columns get a hairline border when the bar spacing is 4 pixels or more.
