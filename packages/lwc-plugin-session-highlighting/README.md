# Session highlighting

A [series primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives)
that shades the background behind each bar of a series. You give it a
function from a bar's time to a color, and every bar of the attached series
gets a full-height column in that color, as wide as the bar itself. The
columns follow the series as the chart scrolls and zooms.

Use it to show where one trading session ends and the next begins, to tint
pre-market and after-hours bars, to mark weekends or holidays, or to shade any
other time-based condition behind the data.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-session-highlighting
```

Then import the plugin and add it to a chart:

```js
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { SessionHighlighting } from '@tradingview/lwc-plugin-session-highlighting';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(CandlestickSeries);
series.setData(data);

series.attachPrimitive(new SessionHighlighting(time => {
    const day = new Date(time * 1000).getUTCDay();
    return day === 0 || day === 6 ? 'rgba(255, 152, 1, 0.2)' : '';
}));
```

### CDN

The plugin is published as ES modules. Map the library and the plugin to their
CDN builds with an import map:

```html
<script type="importmap">
{
  "imports": {
    "lightweight-charts": "https://unpkg.com/lightweight-charts@^5/dist/lightweight-charts.standalone.production.mjs",
    "@tradingview/lwc-plugin-session-highlighting": "https://unpkg.com/@tradingview/lwc-plugin-session-highlighting/dist/session-highlighting.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart, CandlestickSeries } from 'lightweight-charts';
import { SessionHighlighting } from '@tradingview/lwc-plugin-session-highlighting';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(CandlestickSeries);
series.setData(data);

series.attachPrimitive(new SessionHighlighting(time => {
    const day = new Date(time * 1000).getUTCDay();
    return day === 0 || day === 6 ? 'rgba(255, 152, 1, 0.2)' : '';
}));
</script>
```

## Usage

### The highlighter

The first constructor argument is the highlighter: a function which receives
a bar's time and returns a CSS color. Return an empty string for a bar that
should not be shaded. The time comes in whatever form your data uses, so for
business-day data check for an object:

```js
import { isBusinessDay } from 'lightweight-charts';

function toDate(time) {
    if (isBusinessDay(time)) {
        return new Date(Date.UTC(time.year, time.month - 1, time.day));
    }
    return typeof time === 'number' ? new Date(time * 1000) : new Date(time);
}

const highlighter = time => {
    const hour = toDate(time).getUTCHours();
    if (hour < 9 || hour >= 16) {
        return 'rgba(120, 123, 134, 0.15)'; // outside the main session
    }
    return '';
};

const highlighting = new SessionHighlighting(highlighter);
series.attachPrimitive(highlighting);
```

The highlighter is called once per bar when the series data is set, and once
for the last bar when `series.update()` appends or replaces it, so it can do
real work per call; `series.pop()` drops the popped bars without calling it.
Keep it a function of the time alone: a historical update, which is
`series.update(bar, true)`, re-asks it for the last bar rather than for the
bar it changed, and one that turns a bar into whitespace re-asks it for every
bar. Translucent colors let the grid and the series show through; the shading
is drawn behind both by default.

To remove the shading, detach it from the series:

```js
series.detachPrimitive(highlighting);
```

### Changing the shading

```js
highlighting.applyOptions({ zOrder: 'top', visible: false });
highlighting.setHighlighter(time => '#F0F3FA'); // recolors every bar
highlighting.options(); // the current options, with the defaults filled in
```

`applyOptions` merges: an option which is not passed, or is passed as
`undefined`, is left unchanged.

## Options

Options are passed as the second constructor argument, which is optional, as
is every option in it. The type is `SessionHighlightingOptions`, and the
defaults are exported as `defaultOptions`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `visible` | `boolean` | `true` | Whether the shading is drawn at all. |
| `zOrder` | `'bottom' \| 'normal' \| 'top'` | `'bottom'` | Layer the shading is drawn in. `'bottom'` puts it behind the grid and the series. |

## Notes

- Each column is exactly one bar wide, taken from the time scale's bar
  spacing, so neighbouring columns abut with no seams and no overlap at any
  zoom level or device pixel ratio.
- Only bars of the attached series are shaded. Whitespace items and gaps in
  the data get no column, even where another series has a bar at that time.
- The shading appears only in the pane the series is drawn in, never under
  the price scales or the time scale. To shade a second pane, attach another
  `SessionHighlighting` to a series in that pane.
- Only the bars on screen are drawn, so the cost of a paint is bounded by the
  width of the chart, not by the length of the history. An incremental
  `series.update()` or `series.pop()` does read the series data once to find
  out what changed, which is proportional to the number of bars.
