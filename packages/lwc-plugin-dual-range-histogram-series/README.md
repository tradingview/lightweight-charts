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

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-dual-range-histogram-series
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { DualRangeHistogramSeries } from '@tradingview/lwc-plugin-dual-range-histogram-series';

const chart = createChart(document.getElementById('container'));

const histogram = chart.addCustomSeries(new DualRangeHistogramSeries(), {
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
import { DualRangeHistogramSeries } from '@tradingview/lwc-plugin-dual-range-histogram-series';

const chart = createChart(document.getElementById('container'));

const histogram = chart.addCustomSeries(new DualRangeHistogramSeries(), {
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
});
```

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
| `colors` | `{ upOuter, upInner, downOuter, downInner }` of `string` | `{ upOuter: '#ACE5DC', upInner: '#42BDA8', downOuter: '#FCCACD', downInner: '#F77C80' }` | Fill color of each column. |
| `borderRadius` | `{ upOuter, upInner, downOuter, downInner }` of `number` | `{ upOuter: 2, upInner: 0, downOuter: 2, downInner: 0 }` | Corner radius of each column, in CSS pixels, applied to the column's outer end. |
| `maxHeight` | `number` | `130` | Total height of the histogram in CSS pixels; the largest visible value reaches half of it above or below the zero line. |

## Notes

- Values are normalized against the largest absolute value in the **visible**
  range, so column heights change as the user scrolls or zooms.
- Columns are matched to `colors` and `borderRadius` by their **position** in
  `values`, not by their sign: a negative value in the `upOuter` slot points
  downwards but is still drawn in the `upOuter` color.
- Columns for the same point share one width and position; values are drawn in
  array order, so later (inner) values paint over earlier (outer) ones. Keep
  inner values smaller than outer ones for the nested look.
- A point may carry more than four values; the four columns then repeat, so
  `values[4]` is styled as `upOuter` again.
- Columns get a hairline border when the bar spacing is 4 pixels or more.
