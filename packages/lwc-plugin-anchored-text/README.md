# Anchored text

A single line of text anchored to an edge, a corner or the center of a pane,
as a [series primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives)
(`AnchoredText`) or as a
[pane primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/pane-primitives)
(`AnchoredTextPane`). The text keeps its place while the chart scrolls and
zooms, inset from the pane edges by a margin you choose. The text, its anchor,
margins, font, color, layer and visibility can all be changed after the
primitive has been attached.

The series primitive belongs to the series it is attached to: it lives in that
series' pane and is removed together with the series. The pane primitive needs
no series at all.

Use it for a chart title, a symbol or interval label, a data-source credit, or
a "preview" or "draft" stamp.

> **Lightweight Charts™ 5 also ships a built-in text watermark.**
> [`createTextWatermark(pane, options)`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createTextWatermark)
> is a pane primitive which draws one or more lines of text, centered by default
> and scaled down to fit the pane. If that is all you need, the built-in
> function is the right choice. Use this package for text tied to a specific
> series rather than to a pane, or for what the built-in does not offer:
> margins from the pane edge, a CSS `font` shorthand, `zOrder` and
> `setText`.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-anchored-text
```

Then import the plugin and add it to a chart:

```js
import { createChart, LineSeries } from 'lightweight-charts';
import { AnchoredText } from '@tradingview/lwc-plugin-anchored-text';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.setData(data);

series.attachPrimitive(new AnchoredText({ text: 'BTC/USD · 1D' }));
```

### CDN

The plugin is published as ES modules. Map the library and the plugin to their
CDN builds with an import map:

```html
<script type="importmap">
{
  "imports": {
    "lightweight-charts": "https://unpkg.com/lightweight-charts@^5/dist/lightweight-charts.standalone.production.mjs",
    "@tradingview/lwc-plugin-anchored-text": "https://unpkg.com/@tradingview/lwc-plugin-anchored-text/dist/anchored-text.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart, LineSeries } from 'lightweight-charts';
import { AnchoredText } from '@tradingview/lwc-plugin-anchored-text';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.setData(data);

series.attachPrimitive(new AnchoredText({ text: 'BTC/USD · 1D' }));
</script>
```

## Usage

### On a series

Create the text, then attach it to the series whose pane it should sit in:

```js
import { createChart, LineSeries } from 'lightweight-charts';
import { AnchoredText } from '@tradingview/lwc-plugin-anchored-text';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.setData(data);

const title = new AnchoredText({
    text: 'BTC/USD · 1D',
    horzAlign: 'right',
    vertAlign: 'top',
    font: 'bold 16px sans-serif',
    color: '#2962FF',
});
series.attachPrimitive(title);
```

To remove the text, detach it from the series:

```js
series.detachPrimitive(title);
```

### On a pane

`AnchoredTextPane` takes the same options and is attached to a pane instead
of a series. Use it when the text should stay put while series are added and
removed:

```js
import { AnchoredTextPane } from '@tradingview/lwc-plugin-anchored-text';

const title = new AnchoredTextPane({ text: 'Volume', vertAlign: 'bottom' });
chart.panes()[1].attachPrimitive(title);

// later
chart.panes()[1].detachPrimitive(title);
```

### Changing the text

Both classes have the same methods:

```js
title.applyOptions({ horzAlign: 'center', color: '#787B86' });
title.setText('ETH/USD · 1D'); // same as applyOptions({ text })
title.options(); // the current options, with the defaults filled in
```

`applyOptions` merges: an option which is not passed, or is passed as
`undefined`, is left unchanged. The one exception is `lineHeight`: passing
`lineHeight: undefined` goes back to measuring the height from the font.

## Options

Options are passed as the constructor argument, which is optional, as is every
option in it. The type is `AnchoredTextOptions`, and the defaults are exported
as `defaultOptions`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | `''` | The line of text. An empty string draws nothing. |
| `horzAlign` | `'left' \| 'center' \| 'right'` | `'left'` | Which side of the pane the text is anchored to, or centered. |
| `vertAlign` | `'top' \| 'center' \| 'bottom'` | `'top'` | Which edge of the pane the text is anchored to, or centered. |
| `horzMargin` | `number` | `20` | Distance from the left or right pane edge, in CSS pixels. Not used when `horzAlign` is `'center'`. |
| `vertMargin` | `number` | `10` | Distance from the top or bottom pane edge, in CSS pixels. Not used when `vertAlign` is `'center'`. |
| `font` | `string` | `bold 14px` system sans-serif | Font, as a CSS `font` shorthand. |
| `lineHeight` | `number` | — (measured) | Height of the text, in CSS pixels. Measured from the font when not set. |
| `color` | `string` | `'#131722'` | Text color. |
| `visible` | `boolean` | `true` | Whether the text is drawn at all. |
| `zOrder` | `'bottom' \| 'normal' \| 'top'` | `'normal'` | Layer the text is drawn in. `'normal'` draws it with the series, under the crosshair; `'top'` puts it over everything in the pane, the crosshair included; `'bottom'` puts it behind the series. |

### Alignment and margins

The text is placed against the anchored edge of its pane, `horzMargin` and
`vertMargin` away from it. A centered axis ignores its margin. With a
`lineHeight` the text's baseline sits at the bottom of that height, as it did
in the `plugin-examples` version; without one the height is that of the font,
so it does not change with the text, and the baseline sits at the font's
ascent.

## Notes

- The text is drawn on one line, as given. It is neither wrapped nor scaled:
  text wider than the pane is clipped at the pane edge. The built-in
  `createTextWatermark` scales its text down to fit, if that is what you need.
- The text appears only in the pane it belongs to. It never covers the price
  scales or the time scale, and a visible left price scale or a second pane
  does not move it.
- Sizes are in CSS pixels; the text is drawn in the media coordinate space, so
  it stays sharp at any device pixel ratio.
- `'middle'` is still accepted as a value of `horzAlign` and `vertAlign`, the
  spelling used in the `plugin-examples` collection, and is read as `'center'`.
  It is kept for compatibility and will be removed in a future major version.
