# Brushable area series

An area series that can style parts of the data differently. You set a base
style for the whole series and any number of *brush ranges*. A brush range is
a span of data points with its own line and fill colors.

The series itself only draws the styles. Add your own pointer handling to turn
it into a brush selection: the user drags across the chart, you set a brush
range for the selected span, and the rest of the series keeps the base style.
Set a semi-transparent base style to get the classic effect where the
selection stays vivid and the rest looks faded.

Use it for range selection on a sparkline or an overview chart. It also fits
highlighting a period, such as a trading session, an event window, or a
backtest sample, and comparing segments of one series visually.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-brushable-area-series
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { BrushableAreaSeries } from '@tradingview/lwc-plugin-brushable-area-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new BrushableAreaSeries(), {
    lineColor: 'rgba(41, 98, 255, 0.2)',
    topColor: 'rgba(41, 98, 255, 0.05)',
    bottomColor: 'rgba(41, 98, 255, 0)',
    priceLineVisible: false,
});
series.setData(data); // [{ time, value }, ...]
```

### CDN

The plugin is published as ES modules. Map the library and the plugin to their
CDN builds with an import map:

```html
<script type="importmap">
{
  "imports": {
    "lightweight-charts": "https://unpkg.com/lightweight-charts@^5/dist/lightweight-charts.standalone.production.mjs",
    "@tradingview/lwc-plugin-brushable-area-series": "https://unpkg.com/@tradingview/lwc-plugin-brushable-area-series/dist/brushable-area-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart } from 'lightweight-charts';
import { BrushableAreaSeries } from '@tradingview/lwc-plugin-brushable-area-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new BrushableAreaSeries(), {
    lineColor: 'rgba(41, 98, 255, 0.2)',
    topColor: 'rgba(41, 98, 255, 0.05)',
    bottomColor: 'rgba(41, 98, 255, 0)',
    priceLineVisible: false,
});
series.setData(data); // [{ time, value }, ...]
</script>
```

## Usage

Add the [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series) with `addCustomSeries`, set single-value data, then set
`brushRanges` whenever the selection changes:

```js
import { createChart } from 'lightweight-charts';
import { BrushableAreaSeries } from '@tradingview/lwc-plugin-brushable-area-series';

const chart = createChart(document.getElementById('container'));
const series = chart.addCustomSeries(new BrushableAreaSeries(), {
    lineColor: 'rgba(41, 98, 255, 0.2)',
    topColor: 'rgba(41, 98, 255, 0.05)',
    bottomColor: 'rgba(41, 98, 255, 0)',
    priceLineVisible: false,
});
series.setData(data); // [{ time, value }, ...]

// Highlight points 40–80 in green; everything else keeps the faded base style.
series.applyOptions({
    brushRanges: [
        {
            range: { from: 40, to: 80 },
            style: {
                lineColor: '#089981',
                topColor: 'rgba(8, 153, 129, 0.4)',
                bottomColor: 'rgba(8, 153, 129, 0)',
                lineWidth: 3,
            },
        },
    ],
});

// Clear the selection.
series.applyOptions({ brushRanges: [] });
```

Ranges are expressed in **logical indices** (the position of a point in the
data, as used by the time scale's logical range), not in time. To turn a
pointer position into a logical index, use
`chart.timeScale().coordinateToLogical(x)`, where `x` is the pointer's
horizontal position within the plot area.

The series does not handle pointer events itself: the brush interaction —
listening to `mousedown` / `mousemove` / `mouseup`, converting coordinates,
and calling `applyOptions` — belongs to your application. The package's
example contains a complete implementation you can copy.

Each data point is `{ time, value }`. Points without a `value` are treated as
whitespace.

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `lineColor` | `string` | `'rgb(40,98,255)'` | Base line color, used outside brush ranges. |
| `topColor` | `string` | `'rgba(40,98,255, 0.4)'` | Base fill color at the line (top of the gradient). |
| `bottomColor` | `string` | `'rgba(40,98,255, 0)'` | Base fill color at the base price (bottom of the gradient). |
| `lineWidth` | `number` | `2` | Base line width, in CSS pixels. |
| `basePrice` | `number` | `0` | Price the area is filled down to. |
| `brushRanges` | `{ range: { from: number; to: number }; style: { lineColor; topColor; bottomColor; lineWidth } }[]` | `[]` | Ranges of logical indices rendered in their own style. `from` is inclusive, `to` is exclusive. Pass an empty array to clear. |

## Notes

- A point inside a brush range is drawn with that range's style; if ranges
  overlap, the first matching range wins.
- The fill is a vertical gradient from `bottomColor` at `basePrice` to
  `topColor` at the line, per style.
- The example disables chart scrolling and scaling (`handleScroll`,
  `handleScale`) so that dragging brushes instead of panning; decide which
  gesture your chart should own.
