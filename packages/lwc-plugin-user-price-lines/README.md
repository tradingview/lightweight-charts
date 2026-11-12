# User price lines

A [series primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives)
that lets the user add price lines to a series. When the pointer comes near
the right edge of the pane, a small button with a plus follows it up and down;
clicking the button adds a price line at that price.

Use it for levels the user marks by hand: support and resistance, entry and
exit prices, or the price an alert should fire at.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-user-price-lines
```

Then import the plugin and attach it to a series:

```js
import { createChart, LineSeries } from 'lightweight-charts';
import { UserPriceLines } from '@tradingview/lwc-plugin-user-price-lines';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.setData([
    { time: '2024-04-22', value: 101.2 },
    { time: '2024-04-23', value: 102.8 },
    { time: '2024-04-24', value: 100.9 },
]);

series.attachPrimitive(new UserPriceLines({ lineColor: '#F23645' }));
```

### CDN

The plugin is published as ES modules. Map the library and the plugin to their
CDN builds with an import map:

```html
<script type="importmap">
{
  "imports": {
    "lightweight-charts": "https://unpkg.com/lightweight-charts@^5/dist/lightweight-charts.standalone.production.mjs",
    "@tradingview/lwc-plugin-user-price-lines": "https://unpkg.com/@tradingview/lwc-plugin-user-price-lines/dist/user-price-lines.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart, LineSeries } from 'lightweight-charts';
import { UserPriceLines } from '@tradingview/lwc-plugin-user-price-lines';

const chart = createChart(document.getElementById('container'));
const series = chart.addSeries(LineSeries);
series.setData([
    { time: '2024-04-22', value: 101.2 },
    { time: '2024-04-23', value: 102.8 },
    { time: '2024-04-24', value: 100.9 },
]);

series.attachPrimitive(new UserPriceLines({ lineColor: '#F23645' }));
</script>
```

## Usage

Attach the plugin to the series the lines belong to. The button shows near
the right edge of that series' pane, wherever the series has a price, and a
click on it adds a price line to the series at the price under the pointer:

```js
const lines = new UserPriceLines({ maxLines: 3 });
series.attachPrimitive(lines);

// Lines can be added and removed from code as well.
const line = lines.addLine(102.5);
lines.lineAdded().subscribe(added => console.log('added', added.options().price));
lines.lineRemoved().subscribe(removed => console.log('removed', removed.options().price));
lines.removeLine(line);
lines.removeAll();
```

- `addLine(price)` adds a line with the line options and returns its
  `IPriceLine`. A click on the button does the same. At `maxLines`, the
  oldest line is removed first. It throws unless the plugin is attached to a
  series that is on a chart.
- `removeLine(line)` removes a line the plugin added and returns `true`; a
  line it did not add, or one already removed, is left alone and gives
  `false`. `removeAll()` removes every line the plugin added.
- `lines()` lists the lines the plugin added that are still on the series,
  oldest first. A line removed with `series.removePriceLine` is left out.
- `lineAdded()` and `lineRemoved()` fire with each line the plugin adds and
  removes. Lines are removed by `removeLine` and `removeAll`, to stay within
  `maxLines`, and when the plugin is detached.

Detaching the plugin, `series.detachPrimitive(lines)`, stops it listening to
the pointer, removes the lines it added and puts the crosshair mode back.
Attaching it to another series while it is attached moves it there: it is
detached from the first series, which removes its lines there.
`chart.removeSeries` takes the lines away with the series, and the plugin
lets go of the chart on the next pointer event.

### Crosshair mode

The button follows the pointer, so the plugin sets the chart's crosshair to
`CrosshairMode.Normal` while it is attached: in the `Magnet` modes the
crosshair would jump between the series' values instead. The mode the chart
had is put back when the plugin is detached, unless something changed it
from `Normal` in the meantime, in which case it is left as it is. Pass
`setCrosshairMode: false` to leave the crosshair mode alone.

### Several instances

Within a pane, only the instance attached last shows its button and adds
lines, so a click never adds a line to two series at once. When it is
detached, the one attached before it takes over.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `lineColor` | `string` | `'#000000'` | Color of the price lines the plugin adds. |
| `lineWidth` | `LineWidth` | `1` | Width of the price lines, in CSS pixels. |
| `lineStyle` | `LineStyle` | `LineStyle.Dashed` | Style of the price lines. |
| `axisLabelVisible` | `boolean` | `true` | Whether the price lines show their price on the price scale. |
| `buttonColor` | `string` | `''` | Background of the add button. An empty string uses the background of the crosshair's horizontal line label. |
| `hoverColor` | `string` | `'#777777'` | Background of the add button while the pointer is over it. |
| `maxLines` | `number` | `Infinity` | The most lines the plugin keeps; adding one more removes the oldest. Rounded down and at least `1`; a value that is not a number means no limit. |
| `setCrosshairMode` | `boolean` | `true` | Whether the plugin sets the crosshair to `Normal` mode while attached. |

Change them with `lines.applyOptions({ ... })`; `lines.options()` returns
them all. The line options apply to the lines added afterwards. Lowering
`maxLines` removes the oldest lines over the new limit.

## Notes

- The button is reported to the chart's hit test, so the cursor becomes a
  pointer over it and pointer events report `ADD_BUTTON_ID` as the hovered
  object (`param.hoveredObjectId`).
- The button only comes up for the pointer. A crosshair placed with
  `chart.setCrosshairPosition`, as charts kept in sync do, never shows it.
- A tap on a touch screen moves no crosshair, so no button is shown and a tap
  at the edge adds nothing; after a long press has brought the button up,
  only a tap on the button adds a line. The chart reports no click after a
  drag, so a drag that starts on the button adds nothing either.
- The button always sits at the right edge of the pane, which is where the
  pointer leaves the pane for the right price scale. Clicking a line to remove
  it, placing the button by the left price scale and rounding prices to the
  series' price step are not part of this release.

## Migrating from `plugin-examples`

In the `plugin-examples` collection the plugin was created with
`new UserPriceLines(chart, series, options)` and taken off with `remove()`.
Both still work and are deprecated: pass the options only and attach the
plugin with `series.attachPrimitive`, and detach it with
`series.detachPrimitive`. `remove()` now removes the lines the plugin added,
as detaching does, and does not throw once the chart or the series is gone.

The options are renamed: `color`, the color of the lines, is `lineColor`, and
`limitToOne`, which was never read, is `maxLines` (`maxLines: 1` keeps one
line). The lines can now be removed, and the plugin no longer adds lines for
clicks in other panes or for two instances at once.
