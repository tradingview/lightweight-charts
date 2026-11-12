# Heatmap series

A [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series)
that draws a column of cells per time point, each cell covering a price range
and colored by an amount.

Use it to show how something is spread over prices through time: the size
resting at each level of an order book, the volume traded at each price, the
density of a forecast, or any value bucketed by price.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-heatmap-series
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { createColorScale, createHeatmapSeries } from '@tradingview/lwc-plugin-heatmap-series';

const chart = createChart(document.getElementById('container'));
const series = createHeatmapSeries(chart, {
    cellShader: createColorScale({ stops: ['rgba(41, 98, 255, 0.1)', '#2962FF', '#F23645'] }),
});

series.setData([
    { time: '2024-04-22', cells: [{ low: 100, high: 101, amount: 20 }, { low: 101, high: 102, amount: 80 }] },
    { time: '2024-04-23', cells: [{ low: 100, high: 101, amount: 60 }, { low: 101, high: 102, amount: 40 }] },
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
    "@tradingview/lwc-plugin-heatmap-series": "https://unpkg.com/@tradingview/lwc-plugin-heatmap-series/dist/heatmap-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart } from 'lightweight-charts';
import { createColorScale, createHeatmapSeries } from '@tradingview/lwc-plugin-heatmap-series';

const chart = createChart(document.getElementById('container'));
const series = createHeatmapSeries(chart, {
    cellShader: createColorScale({ stops: ['rgba(41, 98, 255, 0.1)', '#2962FF', '#F23645'] }),
});

series.setData([
    { time: '2024-04-22', cells: [{ low: 100, high: 101, amount: 20 }, { low: 101, high: 102, amount: 80 }] },
    { time: '2024-04-23', cells: [{ low: 100, high: 101, amount: 60 }, { low: 101, high: 102, amount: 40 }] },
]);
</script>
```

## Usage

Add the series with `createHeatmapSeries`, then set data with a `cells`
array per point:

```js
const series = createHeatmapSeries(chart, {
    cellShader: (amount, range) => (amount > (range.min + range.max) / 2 ? '#F23645' : '#2962FF'),
    cellGap: 1,
});

series.setData([
    {
        time: '2024-04-22',
        cells: [
            { low: 100, high: 101, amount: 20 },
            { low: 101, high: 102, amount: 80 },
        ],
    },
    { time: '2024-04-23' },
]);
```

Each data point is `{ time, cells }`, and each cell `{ low, high, amount }`:

- A cell is drawn from `low` to `high` across the point's whole slot, in the
  color `cellShader(amount, range)` returns. The edges may come in either
  order, and the cells of a column in any order. Cells are not expected to
  overlap: cells of the same color are filled together, so where two
  overlap, which one shows depends on their colors, not on their order.
- A cell whose `low`, `high` or `amount` is not a finite number is skipped,
  and so is a `null` cell, as a JSON feed may send.
- A point with no cell to draw is whitespace, `cells` that is missing or
  `null` included.

Cells whose price edges meet share a pixel edge, and so do neighboring
columns, so with no gap they abut with no seam and no overlap at every zoom
level and device pixel ratio.

The series autoscales to the lowest and highest cell edge of the points on
screen. The price line and the last value label, off by default, show the
middle of a column's lowest and highest edge. Options can be changed at
runtime with `series.applyOptions({ ... })`.

In the `plugin-examples` collection the types were spelled `HeatMapSeries`,
`HeatMapData`, `HeatMapSeriesOptions` and `HeatMapCellShader`; the package
spells them `HeatmapSeries`, `HeatmapData`, `HeatmapSeriesOptions` and
`HeatmapCellShader`. `HeatmapCell` is unchanged.

## Colors

The shader is called with the cell's amount and the range of the amounts in
view, `{ min, max }`: the lowest and the highest amount among the cells of
the points on screen. A shader can spread its colors over that range rather
than over a maximum worked out in advance, so the colors keep their spread as
the chart scrolls.

`createColorScale({ stops, domain?, steps? })` builds such a shader from a
list of colors:

```js
const shader = createColorScale({
    // Spread evenly from the low end to the high end.
    stops: ['rgba(41, 98, 255, 0.1)', '#2962FF', '#F7A600', '#F23645'],
    // The amounts that take the first and the last stop. Without it, the
    // range of the amounts in view.
    domain: [0, 100],
    // How many colors the scale holds, 2 to 1024. Defaults to 32.
    steps: 16,
});
```

The stops can be any CSS color the canvas accepts, and are mixed with
premultiplied alpha, as CSS gradients are. A stop the canvas cannot parse, or
one in a color space other than sRGB such as `oklch()`, is left out; without a
DOM, as in server-side rendering, only `#rrggbb`, `rgb()` and `rgba()` stops
can be read. An amount
beyond the domain takes the color at that end; a domain given high end first
reverses the scale, and one whose ends are not both finite numbers is ignored.
The colors are worked out once, so the shader builds no color string while
drawing, and the fewer steps there are, the more cells share a fill.

A shader of your own is called for every cell on screen on every paint, so
keep it cheap, and return a limited set of colors: cells are filled together
by color, once per color per paint. A cell whose color the canvas cannot
parse is not drawn.

## Creating a series

Use `createHeatmapSeries(chart, options?, paneIndex?)`. It adds the series and
returns the normal series API, with the plugin's data and options types
filled in. Its options type keeps `cellShader` a function, here and in
`applyOptions`, so an inline shader gets its parameters typed; the library's
`DeepPartial`, which `chart.addCustomSeries` uses, turns a function option
into an object type.

The `HeatmapSeries` class remains available for
`chart.addCustomSeries(new HeatmapSeries(), options)`.

## Options

In addition to the standard
[series options](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon)
(`priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `cellShader` | `(amount: number, range: { min: number; max: number }) => string` | green, from faint at `0` to opaque at `100` | Turns a cell's amount into its fill color, given the range of the amounts in view. A value that is not a function falls back to the default. |
| `cellGap` | `number` | `1` | Space between neighboring cells, in CSS pixels, both between the columns and between the cells of a column. Left out along a side where the cell is not more than three times as long. `0` for none. |
| `cellBorderWidth` | `number` | `0` | Width of the border drawn inside the edge of every cell, in CSS pixels. Left out along a side where the cell, less the gap, is not more than three times as long. `0` for none. |
| `cellBorderColor` | `string` | `'rgba(255, 255, 255, 1)'` | Color of the cell border. A color the canvas cannot parse draws no border. |

The gap and the border are rounded to whole device pixels along each axis.
Whether a cell is long enough for them is decided before its edges are
rounded, so cells of one size all get them or all go without.
A negative width counts as `0`, and one that is not a number as the default.
`lastValueVisible` and `priceLineVisible` default to `false`.

## Notes

- Only the points on screen are drawn, and of their cells only those on the
  pane. A cell whose two edges round to the same device pixel is not drawn,
  which can happen to one under a pixel tall.
- The series has no `conflationReducer`, so the chart never merges its
  points: zoomed out to a bar spacing under a device pixel, every column is
  still worked out, and those that round to no width are skipped.
- On `lightweight-charts` 5.2 and later the series reports the cell under the
  pointer through `hitTest`, in the column whose slot holds the pointer and
  within the series' `hitTestTolerance` (3 px by default) above or below the
  cell: the crosshair's `hoveredInfo.objectId` is `'cell-<index>'`, the index
  into that point's `cells`, and `param.seriesData` holds the point to read
  the cell from. Between a column's lowest and highest edge, holes
  included, the chart's own fallback reports the series as hovered without
  an `objectId`, so check `objectId` before reading a cell. Hovering changes
  nothing in how the series is drawn.
- On 5.2 and later the chart also draws the hovered series above the others
  by default. A heatmap is hovered anywhere over the span of its columns, so
  it then covers a price series drawn on top of it. Create the chart with
  `hoveredSeriesOnTop: false` to keep the other series on top.
