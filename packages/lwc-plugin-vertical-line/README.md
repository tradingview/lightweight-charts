# Vertical line

A [series primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives)
that draws a full-height vertical line at a given time, with an optional label
on the time axis. You attach the line to a series. The line then follows that
series' time scale as the user scrolls and zooms.

Use it to mark a moment in time that matters on your chart:

- an event, such as earnings, a news release, or a dividend date;
- a trade, such as entry and exit points, with a label like `Buy` or `Sell`;
- a boundary, such as a session open or close, the start of a backtest, or
  the current bar.

Because each line is a separate primitive, you can place as many as you need
on the same series, each with its own color, width, and label.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-vertical-line
```

Then import the plugin and add it to a chart:

```js
import { createChart, LineSeries } from 'lightweight-charts';
import { VerticalLine } from '@tradingview/lwc-plugin-vertical-line';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.setData(data);

series.attachPrimitive(new VerticalLine('2024-04-25'));
```

### CDN

The plugin is published as ES modules. Map the library and the plugin to their
CDN builds with an import map:

```html
<script type="importmap">
{
  "imports": {
    "lightweight-charts": "https://unpkg.com/lightweight-charts@^5/dist/lightweight-charts.standalone.production.mjs",
    "@tradingview/lwc-plugin-vertical-line": "https://unpkg.com/@tradingview/lwc-plugin-vertical-line/dist/vertical-line.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart, LineSeries } from 'lightweight-charts';
import { VerticalLine } from '@tradingview/lwc-plugin-vertical-line';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.setData(data);

series.attachPrimitive(new VerticalLine('2024-04-25'));
</script>
```

## Usage

Create a line for a time that exists in your series data, then attach it to that series:

```js
import { createChart, LineSeries } from 'lightweight-charts';
import { VerticalLine } from '@tradingview/lwc-plugin-vertical-line';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.setData(data);

const earningsLine = new VerticalLine('2024-04-25', {
    color: '#2962FF',
    width: 2,
    showLabel: true,
    labelText: 'Earnings',
    labelBackgroundColor: '#2962FF',
    labelTextColor: '#FFFFFF',
});
series.attachPrimitive(earningsLine);
```

To remove a line, detach it from the series:

```js
series.detachPrimitive(earningsLine);
```

The `time` argument accepts any [`Time`](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/Time)
value supported by the chart (a business day string, a `BusinessDay` object,
or a UTC timestamp) — use the same format as your series data.

Change a line after it has been created with `applyOptions` and `setTime`:

```js
earningsLine.applyOptions({ color: '#F23645', labelText: 'Moved' });
earningsLine.setTime('2024-05-02');
```

## Options

All options are optional. Pass them as the second constructor argument.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | `'green'` | Color of the line. |
| `width` | `number` | `3` | Width of the line, in CSS pixels. |
| `lineStyle` | `LineStyle` | `LineStyle.Solid` | Dash pattern of the line. |
| `lineVisible` | `boolean` | `true` | Draw the line itself. Set it to `false` for a time-axis label with no line. |
| `showLabel` | `boolean` | `false` | Show a label at the line's position on the time axis. |
| `tickVisible` | `boolean` | `true` | Draw the tick mark of the time-axis label. |
| `labelText` | `string` | `''` | Text of the time-axis label. Overrides `labelFormatter` when set. |
| `labelFormatter` | `(time) => string` | — | Builds the label text from the line's time. Used only while `labelText` is empty; the default formats the time the way the chart's own time axis does. |
| `labelBackgroundColor` | `string` | `'green'` | Background color of the label. |
| `labelTextColor` | `string` | `'white'` | Text color of the label. |
| `zOrder` | `'bottom' \| 'normal' \| 'top'` | `'normal'` | Layer the line is drawn in. |
| `snap` | `'exact' \| 'nearest'` | `'exact'` | `'exact'` draws the line only at a time which is a bar of the chart; `'nearest'` places it on the closest bar instead. |
| `draggable` | `boolean` | `false` | Lets the user drag the line along the time scale. |
| `hitTestTolerance` | `number` | `4` | Distance from the line, in CSS pixels, still counted as a hit. |
| `id` | `string` | `'vertical-line'` | Reported as `externalId` for a hit on this line. |
| `badge` | `Partial<VerticalLineBadgeOptions> & { text }` | — | Text badge drawn on the line. Omit it for no badge. |

The defaults are exported as `defaultOptions`.

### Badge

A badge is a short caption drawn on the line itself, for text that should stay
next to the line rather than sit on the time axis:

```js
series.attachPrimitive(new VerticalLine('2024-04-25', {
    badge: { text: 'Earnings', backgroundColor: '#2962FF' },
}));
```

| Badge option | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | `''` | Text of the badge. An empty string hides it. |
| `color` | `string` | `'white'` | Text color. |
| `backgroundColor` | `string` | `'green'` | Background color. |
| `borderColor` | `string` | — | Border color. Leave it out for no border. |
| `borderWidth` | `number` | `0` | Border width, in CSS pixels. |
| `borderRadius` | `number` | `4` | Corner radius of the background, in CSS pixels. |
| `font` | `string` | system sans-serif, 12px | Font, as a CSS `font` shorthand. |
| `padding` | `number` | `4` | Space between the text and the edge of the background. |
| `margin` | `number` | `4` | Distance from the line and from the pane edge. |
| `verticalAlign` | `'top' \| 'middle' \| 'bottom'` | `'top'` | Where along the line the badge sits. |
| `horizontalAlign` | `'left' \| 'right'` | `'right'` | Which side of the line the badge sits on. |

The badge defaults are exported as `defaultBadgeOptions`.

### Dragging

With `draggable: true` the line can be moved along the time scale with the
pointer, and `timeChanged()` reports every new time:

```js
const line = new VerticalLine('2024-04-25', { draggable: true });
series.attachPrimitive(line);
line.timeChanged().subscribe(time => console.log(time));
```

Dragging suspends the chart's own scroll and scale handling for the duration of
the gesture, so the chart does not pan under the pointer. Only one line per
chart holds that suspension at a time: where two draggable lines overlap, the
one attached first takes the gesture and the other ignores it, so the chart's
options are restored exactly once. Ownership is tracked per loaded copy of this
module, so two bundles of the plugin on the same page each track their own
owner; load it once per page if you attach overlapping draggable lines.

## Notes

- With the default `snap: 'exact'` the line is drawn only when its time is a
  bar of the chart's time scale; a time between bars or outside the data draws
  nothing, and its time-axis label is hidden with it. Use `snap: 'nearest'` to
  place the line on the closest bar instead.
- The line spans the full height of the pane the series belongs to. To mark a
  time across several panes, attach a line to a series in each pane.
- The label is rendered by the chart's time axis, so it inherits the axis font
  and is hidden together with the axis if `timeScale.visible` is `false`.
- `VertLine` and `VertLineOptions` are still exported, as deprecated aliases of
  `VerticalLine` and `VerticalLineOptions`, and the old
  `new VertLine(chart, series, time, options)` form of the constructor still
  works: the chart and the series arguments are ignored. Both are kept for
  compatibility and will be removed in a future major version.
