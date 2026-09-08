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

## Options

All options are optional. Pass them as the second constructor argument.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | `'green'` | Color of the line. |
| `width` | `number` | `3` | Width of the line, in CSS pixels. |
| `showLabel` | `boolean` | `false` | Show a label at the line's position on the time axis. |
| `labelText` | `string` | `''` | Text of the time-axis label. |
| `labelBackgroundColor` | `string` | `'green'` | Background color of the label. |
| `labelTextColor` | `string` | `'white'` | Text color of the label. |

The defaults are exported as `defaultOptions`.

Options are fixed when the line is created. To change a line, detach it and
attach a new one with the updated options.

## Notes

- The line is drawn only when its time is on the chart's time scale: if the
  time does not match any bar of the attached series (or of any other series
  sharing the time scale), nothing is rendered.
- The line spans the full height of the pane the series belongs to. To mark a
  time across several panes, attach a line to a series in each pane.
- The label is rendered by the chart's time axis, so it inherits the axis font
  and is hidden together with the axis if `timeScale.visible` is `false`.
- `VertLine` and `VertLineOptions` are still exported, as deprecated aliases of
  `VerticalLine` and `VerticalLineOptions`, and the old
  `new VertLine(chart, series, time, options)` form of the constructor still
  works: the chart and the series arguments are ignored. Both are kept for
  compatibility and will be removed in a future major version.
