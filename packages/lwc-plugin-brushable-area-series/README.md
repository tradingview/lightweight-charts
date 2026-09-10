# Brushable area series

An area series that can style parts of the data differently. You set a base
style for the whole series and any number of *brush ranges*. A brush range is
a span of data points with its own line and fill colors.

The series itself only draws the styles. Attach the optional
`BrushableAreaInteraction` primitive, or add your own pointer handling, to turn
it into a brush selection: the user drags across the chart, the brush range for
the selected span is set, and the rest of the series keeps the base style.
Give `outsideStyle` a semi-transparent style to get the classic effect where
the selection stays vivid and the rest looks faded.

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
import { createBrushableAreaSeries } from '@tradingview/lwc-plugin-brushable-area-series';

const chart = createChart(document.getElementById('container'));
const series = createBrushableAreaSeries(chart, {
    lineColor: 'rgb(41, 98, 255)',
    topColor: 'rgba(41, 98, 255, 0.4)',
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
import { createBrushableAreaSeries } from '@tradingview/lwc-plugin-brushable-area-series';

const chart = createChart(document.getElementById('container'));
const series = createBrushableAreaSeries(chart, {
    lineColor: 'rgb(41, 98, 255)',
    topColor: 'rgba(41, 98, 255, 0.4)',
    bottomColor: 'rgba(41, 98, 255, 0)',
    priceLineVisible: false,
});
series.setData(data); // [{ time, value }, ...]
</script>
```

## Usage

Add the [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series) with `createBrushableAreaSeries`, set single-value data, then set
`brushRanges` whenever the selection changes:

```js
import { createChart } from 'lightweight-charts';
import { createBrushableAreaSeries } from '@tradingview/lwc-plugin-brushable-area-series';

const chart = createChart(document.getElementById('container'));
const series = createBrushableAreaSeries(chart, {
    lineColor: 'rgb(41, 98, 255)',
    topColor: 'rgba(41, 98, 255, 0.4)',
    bottomColor: 'rgba(41, 98, 255, 0)',
    priceLineVisible: false,
});
series.setData(data); // [{ time, value }, ...]

// Highlight points 40–80 in green and fade everything else.
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
    outsideStyle: {
        lineColor: 'rgba(41, 98, 255, 0.2)',
        topColor: 'rgba(41, 98, 255, 0.05)',
    },
});

// Clear the selection: the whole series goes back to the base style.
series.applyOptions({ brushRanges: [] });
```

A range's `style` and `outsideStyle` are both partial: every property left out
falls back to the base style set on the series.

Ranges are expressed in **logical indices** of the time scale (the position on
the chart's own index, shared by every series), not in time and not in the
series' own array positions. To turn a pointer position into a logical index,
use `chart.timeScale().coordinateToLogical(x)`, where `x` is the pointer's
horizontal position within the plot area.

Each data point is `{ time, value }`. Points without a `value` are treated as
whitespace, and the line breaks at the gap rather than bridging it.

### Brush selection

`BrushableAreaInteraction` is an optional
[series primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives)
that turns a mouse drag, a one-finger drag or a two-finger gesture into a brush
range, so the pointer handling does not have to be written again in every
application:

```js
import {
    BrushableAreaInteraction,
} from '@tradingview/lwc-plugin-brushable-area-series';

const brush = new BrushableAreaInteraction({
    style: { lineColor: '#089981', topColor: 'rgba(8, 153, 129, 0.4)' },
    outsideStyle: { lineColor: 'rgba(41, 98, 255, 0.2)' },
});
series.attachPrimitive(brush);

brush.activeRange().subscribe(range => {
    // null once the selection is cleared by a click without a drag
    if (range !== null) {
        console.log(range.from, range.to, range.fromTime, range.toTime);
    }
});
```

| Interaction option | Type | Default | Description |
| --- | --- | --- | --- |
| `style` | `Partial<style>` | green | Style applied to the brushed range. |
| `outsideStyle` | `Partial<style>` | faded blue | Style applied outside the brushed range. |
| `applyToSeries` | `boolean` | `true` | Set the series' `brushRanges` as the user drags. Turn it off to only receive `activeRange` events. |
| `minimumRangeWidth` | `number` | `1` | Smallest drag, in logical indices, that counts as a range. |

The defaults are exported as `defaultInteractionOptions`. The range reported by
`activeRange()` carries `from` / `to` as logical indices and `fromTime` /
`toTime` as the times of the data points at those indices (`null` where the
series has no point there). `brush.clear()` removes the selection, and
`brush.range()` returns the current one.

The chart's own drag gesture competes with brushing, so a chart using this
primitive normally sets `handleScroll: false` and `handleScale: false`.

## Options

In addition to the standard
[custom series options](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/CustomSeriesOptions)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `lineColor` | `string` | `'rgb(40,98,255)'` | Base line color, used outside brush ranges. |
| `topColor` | `string` | `'rgba(40,98,255, 0.4)'` | Base fill color at the line (top of the gradient). |
| `bottomColor` | `string` | `'rgba(40,98,255, 0)'` | Base fill color at the base price (bottom of the gradient). |
| `lineWidth` | `1 \| 2 \| 3 \| 4` | `2` | Base line width, in CSS pixels. |
| `lineStyle` | `LineStyle` | `LineStyle.Solid` | Base dash pattern of the line. |
| `lineVisible` | `boolean` | `true` | Draw the line itself. Set it to `false` for the fill only. |
| `lineType` | `LineType` | `LineType.Simple` | Shape of the line between two points: straight, stepped or curved. The fill follows the same shape. |
| `relativeGradient` | `boolean` | `false` | Anchor the far end of the fill gradient to the outermost point in view rather than to the edge of the pane, as `AreaSeries` does. |
| `invertFilledArea` | `boolean` | `false` | Fill the area above the line, up to the top of the pane, instead of down to `basePrice`. |
| `basePrice` | `number` | `0` | Price the area is filled down to. |
| `brushRanges` | `{ range: { from: number; to: number }; style: Partial<style> }[]` | `[]` | Ranges of logical indices rendered in their own style. `from` is inclusive, `to` is exclusive. Set an empty array to clear. |
| `outsideStyle` | `Partial<style>` | — | Style of the points outside every brush range. Used only while at least one range is set. |

`style` is `{ lineColor, topColor, bottomColor, lineWidth, lineStyle }` — the
same five properties as the base style, and each one optional.

## Notes

- A point inside a brush range is drawn with that range's style; if ranges
  overlap, the **last** matching range wins, so a new selection covers the ones
  it is dragged over.
- Each drawn segment takes the style of its right-hand point, and consecutive
  points sharing a style are drawn as one path, so no seam shows inside a run.
- The fill is a vertical gradient from `bottomColor` at `basePrice` to
  `topColor` at the edge of the pane the fill extends towards (or at the
  outermost point in view with `relativeGradient`). When `basePrice` falls
  outside the visible price range, the fill reaches the edge of the pane.
- The line and the fill are drawn one bar past each edge of the visible range,
  so they leave the pane rather than stopping at the last visible point while
  the chart is panned.
- Points whose value falls outside the current price scale, and gaps in the
  data, break the line rather than being drawn to an invalid coordinate.
- The examples disable chart scrolling and scaling (`handleScroll`,
  `handleScale`) so that dragging brushes instead of panning; decide which
  gesture your chart should own.

### Explicit whitespace

Use `createBrushableAreaSeries` to retain whitespace passed through `setData` and
`update`, including historical corrections. Other series' timestamps do not
break the area. The low-level `BrushableAreaSeries` view remains available, but
without the factory's gap predicate it draws continuously: the host does not
provide whitespace to custom renderers.

Under time-scale conflation the area is drawn from buckets of several bars, and
a whitespace run narrower than one bucket cannot be resolved at that bar
spacing: it is absorbed into the bucket rather than breaking the area at every
bar. Zooming in past the conflation threshold shows the gap again.
