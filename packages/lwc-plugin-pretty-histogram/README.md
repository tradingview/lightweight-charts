# Pretty histogram series

A [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series) that draws a histogram with rounded bars. Unlike the built-in
histogram series, it can round the outer corners of each bar. It also controls
the bar width as a share of the bar spacing. The result is a softer look that
fits dashboards and marketing-style charts.

Use it for volume panes, single-value indicators, or any bar chart where the
default square bars look too heavy.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-pretty-histogram
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { PrettyHistogramSeries } from '@tradingview/lwc-plugin-pretty-histogram';

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
    "@tradingview/lwc-plugin-pretty-histogram": "https://unpkg.com/@tradingview/lwc-plugin-pretty-histogram/dist/pretty-histogram.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart } from 'lightweight-charts';
import { PrettyHistogramSeries } from '@tradingview/lwc-plugin-pretty-histogram';

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
import { PrettyHistogramSeries } from '@tradingview/lwc-plugin-pretty-histogram';

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

### Keeping the baseline in view

Bars grow from the zero line. If your values never cross zero, the default
autoscale may exclude it, and the bars will appear cut off at the edge of the
pane. Extend the autoscale range to include zero:

```js
const series = chart.addCustomSeries(new PrettyHistogramSeries(), {
    autoscaleInfoProvider: original => {
        const res = original();
        if (!res?.priceRange) {
            return res;
        }
        return {
            ...res,
            priceRange: {
                minValue: Math.min(res.priceRange.minValue, 0),
                maxValue: Math.max(res.priceRange.maxValue, 0),
            },
        };
    },
});
```

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | `'#D63864'` | Fill color of the bars. A per-point `color` in the data overrides it. |
| `widthPercent` | `number` | `50` | Bar width as a percentage of the bar spacing, `0`–`100`. |
| `radius` | `number` | `4` | Corner radius of the bar's outer end, in CSS pixels. Positive bars are rounded at the top, negative bars at the bottom. The radius is capped at half the bar width and at the bar height. |

## Notes

- Bars are anchored at the zero line of the price scale; see
  [Keeping the baseline in view](#keeping-the-baseline-in-view).
- Bars are drawn in batches: consecutive bars of the same color are filled in
  one canvas operation. The series renders quickly even with thousands of
  bars, as long as the color does not change on every bar.
