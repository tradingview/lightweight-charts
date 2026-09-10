# Image watermark

A [series primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives)
that draws an image behind the attached series. The image is centered in the
plot area and scaled to fit, keeping its aspect ratio. Size limits, padding,
and opacity are configurable.

The watermark belongs to the series it is attached to. It lives in that
series' pane and is removed together with the series.

Use it to brand a chart with a logo, or to mark a chart as a preview or draft,
without touching the chart's own rendering.

> **Lightweight Charts™ 5 also ships a built-in image watermark.**
> [`createImageWatermark(pane, url, options)`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createImageWatermark)
> is a pane primitive with the same options. For most charts, the built-in
> function is the right choice. Use this package when the watermark must be
> tied to a specific series rather than to a pane. For example, when series
> are added and removed at runtime and the watermark should follow one of
> them.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-image-watermark
```

Then import the plugin and add it to a chart:

```js
import { createChart, LineSeries } from 'lightweight-charts';
import { ImageWatermark } from '@tradingview/lwc-plugin-image-watermark';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.setData(data);

series.attachPrimitive(new ImageWatermark('/logo.svg', { alpha: 0.4 }));
```

### CDN

The plugin is published as ES modules. Map the library and the plugin to their
CDN builds with an import map:

```html
<script type="importmap">
{
  "imports": {
    "lightweight-charts": "https://unpkg.com/lightweight-charts@^5/dist/lightweight-charts.standalone.production.mjs",
    "@tradingview/lwc-plugin-image-watermark": "https://unpkg.com/@tradingview/lwc-plugin-image-watermark/dist/image-watermark.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart, LineSeries } from 'lightweight-charts';
import { ImageWatermark } from '@tradingview/lwc-plugin-image-watermark';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.setData(data);

series.attachPrimitive(new ImageWatermark('/logo.svg', { alpha: 0.4 }));
</script>
```

## Usage

Create the watermark with the image URL, then attach it to the series it
should follow:

```js
import { createChart, LineSeries } from 'lightweight-charts';
import { ImageWatermark } from '@tradingview/lwc-plugin-image-watermark';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.setData(data);

const watermark = new ImageWatermark('/logo.svg', {
    maxHeight: 400,
    maxWidth: 400,
    padding: 50,
    alpha: 0.4,
});
series.attachPrimitive(watermark);
```

To remove the watermark, detach it from the series:

```js
series.detachPrimitive(watermark);
```

The image is loaded when the primitive is attached and drawn once it has
loaded; until then nothing is rendered. Any URL the browser can load into an
`<img>` element works, including SVG and data URLs.

## Options

All options are optional. Pass them as the second constructor argument.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `maxWidth` | `number` | — (plot area width) | Maximum width of the drawn image, in CSS pixels. |
| `maxHeight` | `number` | — (plot area height) | Maximum height of the drawn image, in CSS pixels. |
| `padding` | `number` | `0` | Minimum distance between the image and the edges of the plot area, in CSS pixels. |
| `alpha` | `number` | `1` | Opacity of the image, from `0` (invisible) to `1` (opaque). |

The image is scaled — up or down — to fit the available space (the plot area
minus `padding`, further limited by `maxWidth` / `maxHeight`), preserving its
aspect ratio, and centered in the plot area. Set `maxWidth` / `maxHeight` to the
image's natural size if you do not want it enlarged.

Options and the image URL are fixed when the watermark is created. To change
them, detach the watermark and attach a new one.

## Notes

- The watermark is drawn behind the chart content. The grid, the series, and
  other primitives all appear on top of it. Only the pane background is below
  the watermark.
- The image appears only in the plot area, where the series is drawn. It never
  covers the price scales or the time scale.
- The image can be loaded from any origin. However, an image served without
  CORS headers marks the canvas as "tainted", and
  [`takeScreenshot`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#takescreenshot)
  fails on a tainted canvas. If you plan to export the chart as an image, serve
  the watermark image with CORS headers.
