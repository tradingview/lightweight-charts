# Background shade series

A [custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series)
that shades the full height of the pane behind each bar. The shade is mixed
from two colors by where the bar's value sits between a low and a high value,
so the background follows an indicator while the price series stays readable
on top of it.

Use it to show a regime or a reading behind the price: an oscillator, the
share of up days, volatility, a sentiment score, or a session's volume
relative to normal.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-background-shade-series
```

Then import the plugin and add it to a chart:

```js
import { createChart, LineSeries } from 'lightweight-charts';
import { createBackgroundShadeSeries } from '@tradingview/lwc-plugin-background-shade-series';

const chart = createChart(document.getElementById('container'));
const line = chart.addSeries(LineSeries);
line.setData([
    { time: '2024-04-22', value: 101.2 },
    { time: '2024-04-23', value: 102.8 },
    { time: '2024-04-24', value: 100.9 },
]);

const shade = createBackgroundShadeSeries(chart, {
    lowColor: '#F23645',
    highColor: '#089981',
    opacity: 0.25,
});
shade.setData([
    { time: '2024-04-22', value: 35 },
    { time: '2024-04-23', value: 70 },
    { time: '2024-04-24', value: 20 },
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
    "@tradingview/lwc-plugin-background-shade-series": "https://unpkg.com/@tradingview/lwc-plugin-background-shade-series/dist/background-shade-series.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart, LineSeries } from 'lightweight-charts';
import { createBackgroundShadeSeries } from '@tradingview/lwc-plugin-background-shade-series';

const chart = createChart(document.getElementById('container'));
const line = chart.addSeries(LineSeries);
line.setData([
    { time: '2024-04-22', value: 101.2 },
    { time: '2024-04-23', value: 102.8 },
    { time: '2024-04-24', value: 100.9 },
]);

const shade = createBackgroundShadeSeries(chart, {
    lowColor: '#F23645',
    highColor: '#089981',
    opacity: 0.25,
});
shade.setData([
    { time: '2024-04-22', value: 35 },
    { time: '2024-04-23', value: 70 },
    { time: '2024-04-24', value: 20 },
]);
</script>
```

## Usage

Add the series with `createBackgroundShadeSeries`, then set data with a
`value` per bar:

```js
const shade = createBackgroundShadeSeries(chart, {
    lowColor: 'rgb(50, 50, 255)',
    highColor: 'rgb(255, 50, 50)',
    lowValue: 0,
    highValue: 100,
    opacity: 0.8,
});

shade.setData([
    { time: '2024-04-22', value: 35 },
    { time: '2024-04-23', value: 120 },
    { time: '2024-04-24' },
    { time: '2024-04-25', value: 50, color: '#131722' },
]);
```

Each data point is `{ time, value }`:

- A value of `lowValue` gets `lowColor`, a value of `highValue` gets
  `highColor`, and a value in between a mix of the two. Values beyond the
  range get the color of the nearer end. `lowValue` may be the larger of the
  two. With `lowValue` equal to `highValue` the shading becomes a two-color
  threshold: values below it get `lowColor` and the rest `highColor`.
- A point without a finite `value`, `null` and `NaN` included, is whitespace
  and leaves its slot unshaded.
- A `color` on a point shades that bar with it, whatever its value. A color
  the canvas does not accept is ignored, and the bar is shaded from its value.
  The series' own `color` option is not drawn; it is empty by default, and a
  point whose `color` equals it is shaded from its value.

`lowColor` and `highColor` can be hex, `rgb()`, `rgba()`, `hsl()` or named
colors. They are mixed with premultiplied alpha, as CSS gradients are, so a
transparent end, `'transparent'` included, fades the other color out. A color
that cannot be parsed, or one in another color space such as `oklch()`, falls
back to the default for that end.

The series shades the full height of its pane and takes no part in the price
scale. It sits on a price scale of its own, `'background-shade'`, an overlay
scale with nothing drawn on it, so it never sets the number format of the
price axis; its values never change any autoscale range; and it has no price
line or last value label. It still draws when it is the only series in the
chart. It is never reported as hovered, so it does not get in the way of the
series on top of it.

## Creating a series

Use `createBackgroundShadeSeries(chart, options?, paneIndex?)`. It adds the
series and moves it behind every other series in its pane with
`series.setSeriesOrder(0)`, so it reads as a background whatever order the
series are added in. `setSeriesOrder` arrived in `lightweight-charts` 5.0.6;
on older versions the series keeps the order it was added in, so add it
before the others.

Moving the series to another pane, with `series.moveToPane`, puts it on top
of that pane's series, as for any series; call `series.setSeriesOrder(0)`
again afterwards.

The `BackgroundShadeSeries` class remains available for
`chart.addCustomSeries(new BackgroundShadeSeries(), options)`. Added that way,
it gets the same options, its own price scale included, but is drawn in the
order it was added: added after the main series, an opaque shade covers it.
Add it first, or call `series.setSeriesOrder(0)`.

## Options

In addition to the standard
[series options](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon):

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `lowColor` | `string` | `'rgb(50, 50, 255)'` | Shade of a bar whose value is `lowValue`, or beyond it. |
| `highColor` | `string` | `'rgb(255, 50, 50)'` | Shade of a bar whose value is `highValue`, or beyond it. |
| `lowValue` | `number` | `0` | Value shaded with `lowColor`. |
| `highValue` | `number` | `100` | Value shaded with `highColor`. |
| `opacity` | `number` | `0.8` | Opacity of the whole shading, `0`–`1`, on top of any alpha in the colors. |

`priceLineVisible` and `lastValueVisible` default to `false`, since the series
has no value on the price scale, and `priceScaleId` to `'background-shade'`.
Setting `priceScaleId` to `'right'` or `'left'` puts the shade on a visible
scale, where, being the bottom series, it would set that scale's number
format; it still never changes the scale's range.

## Notes

- Each bar is shaded across one bar spacing centered on it, in whole device
  pixels, so the slots of consecutive bars abut with no seam and no overlap at
  every zoom level and device pixel ratio. Time points that only other series
  have stay unshaded: daily values over hourly candles, say, shade one slot a
  day. On `lightweight-charts` 5.1 and later, while the chart conflates data, a
  conflated bar's column is as wide as the slots it stands for, centered where
  the chart places the bar, and it keeps the later of the two values it
  merges.
- Only the bars on screen are drawn. Their shades come from 256 steps between
  the two end colors, worked out when the colors change, so no color is
  mixed while drawing.
- The shading covers its own pane only. To shade another pane, add a second
  series to it with the `paneIndex` argument.
