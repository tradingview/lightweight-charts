# Box and whisker series

A [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series)
that draws a box plot per time point: a box from the first to the third
quartile split at the median, whiskers out to the `min` and `max` you give,
and a dot for each outlier you list beyond them. Where the whiskers end is
yours to decide, such as 1.5 times the interquartile range or the 5th and
95th percentiles, and the values past them are the outliers.

Use it to show how a distribution changes over time rather than a single
value: intraday price distribution per day, latency percentiles per hour,
or the spread of forecasts per period.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-box-whisker-series
```

Then import the plugin and add it to a chart:

```js
import { createChart } from 'lightweight-charts';
import { createBoxWhiskerSeries } from '@tradingview/lwc-plugin-box-whisker-series';

const chart = createChart(document.getElementById('container'));
const series = createBoxWhiskerSeries(chart);

series.setData([
    { time: '2024-04-22', min: 55, q1: 70, median: 80, q3: 85, max: 95 },
    { time: '2024-04-23', min: 50, q1: 70, median: 78, q3: 83, max: 90, outliers: [40] },
    { time: '2024-04-24', min: 58, q1: 68, median: 75, q3: 85, max: 90 },
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
    "@tradingview/lwc-plugin-box-whisker-series": "https://unpkg.com/@tradingview/lwc-plugin-box-whisker-series/dist/box-whisker-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart } from 'lightweight-charts';
import { createBoxWhiskerSeries } from '@tradingview/lwc-plugin-box-whisker-series';

const chart = createChart(document.getElementById('container'));
const series = createBoxWhiskerSeries(chart);

series.setData([
    { time: '2024-04-22', min: 55, q1: 70, median: 80, q3: 85, max: 95 },
    { time: '2024-04-23', min: 50, q1: 70, median: 78, q3: 83, max: 90, outliers: [40] },
    { time: '2024-04-24', min: 58, q1: 68, median: 75, q3: 85, max: 90 },
]);
</script>
```

## Usage

Add the series with `createBoxWhiskerSeries`, then set data with five
numbers per point:

```js
const series = createBoxWhiskerSeries(chart, {
    whiskerColor: '#131722',
    lowerBoxColor: '#90BFF9',
    upperBoxColor: '#2962FF',
    medianColor: '#FFFFFF',
    outlierColor: '#F23645',
});

series.setData([
    { time: '2024-04-22', min: 55, q1: 70, median: 80, q3: 85, max: 95 },
    { time: '2024-04-23', min: 50, q1: 70, median: 78, q3: 83, max: 90, outliers: [40, 100] },
    { time: '2024-04-24' },
    { time: '2024-04-25', min: 58, q1: 68, median: 75, q3: 85, max: 90, upperBoxColor: '#F23645' },
]);
```

Each data point is `{ time, min, q1, median, q3, max, outliers? }`:

- The whiskers run from `min` to `q1` and from `q3` to `max`, and the box from
  `q1` to `q3`, split at the `median` into a lower and an upper half.
- `outliers` holds the values beyond the whiskers, each drawn as a dot. `null`
  means none, and an outlier which is not a finite number is not drawn.
- A point without five finite numbers, a missing or `null` one included, is
  whitespace: it keeps its place on the time scale, is not drawn, and takes
  no part in the price scale.
- `whiskerColor`, `lowerBoxColor`, `upperBoxColor`, `medianColor` and
  `outlierColor` on a point override the series options of the same names
  for that point.

The autoscale range covers the lowest and the highest of the five numbers and
the outliers, so every dot is in view, and a point whose numbers are not in
order still fits on the scale.

The series' price line and last value label follow the median of the last
point. Options can be changed at runtime with `series.applyOptions({ ... })`.

In the `plugin-examples` collection this series was `WhiskerBoxSeries`, with a
`quartiles` array instead of the five named numbers and `lowerQuartileFill` /
`upperQuartileFill` for the box colors. The package was never published under
those names, so it does not keep them.

## Creating a series

Use `createBoxWhiskerSeries(chart, options?, paneIndex?)`. It adds a
`BoxWhiskerSeries` with `chart.addCustomSeries` and returns the normal series
API, typed `BoxWhiskerSeriesApi`, with the plugin's data and options types
preserved. The `BoxWhiskerSeries` class remains available for
`chart.addCustomSeries(new BoxWhiskerSeries(), options)` too; no option
changes the plot values, so both behave the same.

## Options

In addition to the standard
[series options](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon)
(`priceLineVisible`, `lastValueVisible`, `priceFormat`, `autoscaleInfoProvider`, …):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `whiskerColor` | `string` | `'rgba(106, 27, 154, 1)'` | Color of the whiskers and their end caps. |
| `lowerBoxColor` | `string` | `'rgba(103, 58, 183, 1)'` | Fill of the lower half of the box, from `q1` to the median. |
| `upperBoxColor` | `string` | `'rgba(233, 30, 99, 1)'` | Fill of the upper half of the box, from the median to `q3`. |
| `medianColor` | `string` | `'rgba(106, 27, 154, 1)'` | Color of the median line across the box. |
| `outlierColor` | `string` | `'rgba(149, 152, 161, 1)'` | Color of the outlier dots. |

The standard `color` option is not used for the box plots; it colors the
series' price line.

## Notes

- The box is as wide as a candlestick body at the same bar spacing, and every
  part is centered on the whisker line in whole device pixels, the way the
  built-in candlestick centers its body on the wick. The median line spans
  the slot, each whisker cap is as wide as a candlestick body at half the bar
  spacing, and outlier dots shrink with the box down to a 1.5 px radius, so
  they stay visible when the chart is zoomed out.
- Only the points on screen are drawn. The series is never conflated: with
  `timeScale.enableConflation` on, the chart still draws every point.
- On `lightweight-charts` 5.2 and later the series reports the part under the
  pointer through `hitTest`, within the series' `hitTestTolerance` (3 px by
  default). The crosshair event's `hoveredInfo.objectId` is `'box-<point>'`,
  `'median-<point>'`, `'whisker-<point>'` or `'outlier-<point>-<index>'`,
  where `<point>` is the point's position in `series.data()` and `<index>`
  the index into its `outliers`. Elsewhere in a point's slot, between its
  lowest and highest value, the chart's own fallback still reports the series
  as hovered, without an `objectId`, so check `objectId` before reading it.
  The median line, drawn over the box, is reported on its own row of pixels.
  An outlier dot is reported as a point and the box and the lines as ranges,
  so a candle body the pointer is inside wins over a whisker it is only near.
  Older versions never call `hitTest`.
