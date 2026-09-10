# Image watermark

An image drawn behind the chart content, as a
[series primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives)
(`ImageWatermark`) or as a
[pane primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/pane-primitives)
(`ImageWatermarkPane`). The image is placed within the pane — centered by
default, or anchored to a corner — and scaled to fit, to fill, or not at all.
Position, size limits, padding, opacity and visibility can all be changed after
the watermark has been attached.

The series primitive belongs to the series it is attached to: it lives in that
series' pane and is removed together with the series. The pane primitive needs
no series at all.

Use it to brand a chart with a logo, or to mark a chart as a preview or draft,
without touching the chart's own rendering.

> **Lightweight Charts™ 5 also ships a built-in image watermark.**
> [`createImageWatermark(pane, url, options)`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createImageWatermark)
> is a pane primitive which centers an image and scales it to fit. If that is
> all you need, the built-in function is the right choice. Use this package for
> a watermark tied to a specific series rather than to a pane, or for anything
> the built-in does not offer: corner and fractional positions, `objectFit`,
> `crossOrigin`, `visible`, `zOrder`, `applyOptions` / `setImage` and an
> `onError` callback.

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

### Behind a series

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

### Behind a pane

`ImageWatermarkPane` takes the same image URL and the same options, and is
attached to a pane instead of a series. Use it when the watermark should stay
put while series are added and removed:

```js
import { ImageWatermarkPane } from '@tradingview/lwc-plugin-image-watermark';

const watermark = new ImageWatermarkPane('/logo.svg', { alpha: 0.4 });
chart.panes()[0].attachPrimitive(watermark);

// later
chart.panes()[0].detachPrimitive(watermark);
```

### Changing the watermark

Both classes have the same methods:

```js
watermark.applyOptions({ position: 'bottom-right', alpha: 0.2 });
watermark.setImage('/other-logo.svg'); // same as applyOptions({ imageUrl })
watermark.options(); // the current options, with the defaults filled in
```

`applyOptions` merges: an option which is not passed, or is passed as
`undefined`, is left unchanged.

The image is loaded when the primitive is attached and drawn once it has
decoded; until then nothing is rendered. Any URL the browser can load into an
`<img>` element works, including SVG and data URLs. Decoded images are cached
by URL, so detaching and re-attaching a watermark — or using the same image
twice — never loads it again.

## Options

Options are passed as the second constructor argument, which is optional, as
is every option in it. The type is `ImageWatermarkPluginOptions`, and the
defaults are exported as `defaultOptions`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `imageUrl` | `string` | `''` | URL of the image. The first constructor argument sets the same option. |
| `position` | `WatermarkPosition` | `'center'` | Where the image sits in the pane: `'center'`, `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`, or `{ x, y }`. |
| `objectFit` | `WatermarkObjectFit` | `'contain'` | `'contain'` scales the image to fit, `'cover'` scales it to fill and crops the overflow, `'none'` draws it at its natural size. |
| `maxWidth` | `number` | — (pane width) | Maximum width of the drawing area, in CSS pixels. |
| `maxHeight` | `number` | — (pane height) | Maximum height of the drawing area, in CSS pixels. |
| `padding` | `number` | `0` | Minimum distance between the drawing area and the edges of the pane, in CSS pixels. |
| `alpha` | `number` | `1` | Opacity of the image, from `0` (invisible) to `1` (opaque). |
| `visible` | `boolean` | `true` | Whether the watermark is drawn at all. |
| `zOrder` | `'bottom' \| 'normal' \| 'top'` | `'bottom'` | Layer the watermark is drawn in. `'bottom'` puts it behind the grid and the series. |
| `crossOrigin` | `'anonymous' \| 'use-credentials'` | — | `crossOrigin` attribute of the underlying `<img>` element. |
| `onError` | `(error, imageUrl) => void` | — | Called when the image cannot be loaded. Nothing else reports the failure. |

### Position and size

The drawing area is the pane inset by `padding` and limited to `maxWidth` /
`maxHeight`. `position` places that area within the pane and the image within
that area:

- a named anchor — `'center'` or one of the four corners;
- `{ x, y }`, fractions of the free space from `0` to `1`. `{ x: 0, y: 0 }` is
  the top-left corner, `{ x: 1, y: 1 }` the bottom-right one, `{ x: 0.5, y: 0 }`
  the middle of the top edge. Values outside `0`…`1` are clamped.

`objectFit` then decides the scale. With `'contain'` (the default) the image is
scaled up or down to fit, keeping its aspect ratio; set `maxWidth` /
`maxHeight` to its natural size if it should never be enlarged. With `'cover'`
it is scaled to fill the drawing area and the overflow is cropped, and with
`'none'` it is drawn at its natural size. Nothing is ever drawn outside the
drawing area, so `padding` always holds.

## Notes

- The watermark is drawn behind the chart content by default: the grid, the
  series, and other primitives all appear on top of it. Only the pane
  background is below it. Pass `zOrder: 'top'` to draw it over everything
  instead.
- The image appears only in the pane it belongs to, where the series is drawn.
  It never covers the price scales or the time scale, and a visible left price
  scale or a second pane does not move it.
- A watermark whose image cannot be loaded draws nothing and throws nothing.
  Pass `onError` to be told about it; the plugin logs nothing itself.
- `ImageWatermarkOptions` is still exported, as a deprecated alias of
  `ImageWatermarkPluginOptions`. The plugin option type was renamed because
  the library exports an `ImageWatermarkOptions` of its own, for the built-in
  `createImageWatermark`. The alias is kept for compatibility and will be
  removed in a future major version.
- The image can be loaded from any origin. However, an image served without
  CORS headers marks the canvas as "tainted", and
  [`takeScreenshot`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#takescreenshot)
  fails on a tainted canvas. If you plan to export the chart as an image, serve
  the watermark image with CORS headers and set `crossOrigin: 'anonymous'`.
