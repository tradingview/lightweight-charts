# Accessibility Plugin (a11y)

A drop-in accessibility helper built on
[pane primitives](https://tradingview.github.io/lightweight-charts/docs/next/plugins/intro)
that adds a semantic accessibility layer to a Lightweight Charts™ chart, helping
your application meet [WCAG 2.1 Level AA](https://www.w3.org/TR/WCAG21/).

Canvas-based charts are opaque to assistive technology. This plugin productises
the techniques from the
[accessibility tutorial](https://tradingview.github.io/lightweight-charts/tutorials/a11y/intro)
so you get keyboard navigation, screen-reader announcements and a visible focus
indicator without any manual wiring.

Use the chart-level helper for normal integration. It attaches one primitive per
pane, and each pane gets an independent, labelled, keyboard-focusable semantic
layer. Within a pane the plugin handles every series, so multi-series and
multi-pane charts are supported out of the box.

## How to use

Enable the plugin for every current pane with one chart-level call:

```js
import { createChart, LineSeries } from 'lightweight-charts';
import { addAccessibilityPlugin } from './plugins/accessibility/accessibility';

const chart = createChart(document.getElementById('chart'));
const series = chart.addSeries(LineSeries);
series.setData(myData);

const accessibility = addAccessibilityPlugin(chart, {
    chartTitle: 'Apple daily close',
});
```

For a multi-pane chart, pass a title resolver:

```js
addAccessibilityPlugin(chart, {
    chartTitle: paneIndex => paneIndex === 0 ? 'Price' : 'Volume',
});
```

To turn it off again, detach the controller – the plugin restores the DOM to
the state it found it in:

```js
accessibility.detach();
```

If you need low-level control, you can still attach `AccessibilityPlugin`
directly as a pane primitive. In that mode `paneIndex` must match the pane you
attach to.

## What it does

- **Semantic layer.** Each pane gets a labelled, keyboard-focusable overlay
  (`role="application"`, `aria-label`, `tabindex="0"`), while the pane's table
  scaffolding is marked presentational and the visual canvases are hidden from
  assistive technology with `aria-hidden`. Focusable chart internals such as the
  attribution link are removed from the tab order and hidden from the
  accessibility tree.
- **Keyboard navigation.** Users traverse every data point with the left/right
  arrows and switch between the series in the pane with the up/down arrows. The
  focused point is always paged into view, so the whole series is reachable by
  keyboard even when only part of it is on screen.
- **ARIA-live announcements.** The focused point, series changes and on-demand
  summaries are announced through a per-pane assertive live region. Background
  data updates go through a single polite live region shared by the whole chart,
  so simultaneous updates in different panes never talk over each other
  (`announceDataUpdates`, see below).
- **Visible focus indicator.** The focused pane receives an outline, and an
  optional focus ring is drawn over the active point. The point ring stays
  aligned with the canvas as you scroll or zoom.

### Keyboard map

| Key | Action |
| --- | --- |
| `Tab` | Move focus between panes / out of the chart |
| `←` / `→` | Move to the previous / next data point |
| `↑` / `↓` | Switch to the previous / next series in the pane |
| `Page Up` / `Page Down` | Jump by `pageStep` points (default 10): `Page Up` forward in time, `Page Down` back — following the ARIA slider convention that `Page Up` increases the value |
| `Home` / `End` | Jump to the first / last point |
| `Enter` / `Space` | Announce a summary of the active series |
| `H` | Announce the list of keyboard controls |

## Options

All options are optional and have sensible defaults.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `chartTitle` | `string` | `'Interactive financial chart'` | Accessible name of the pane region. |
| `paneIndex` | `number` | `0` | Index of the pane this primitive is attached to. Only needed when manually attaching `AccessibilityPlugin`; `addAccessibilityPlugin` sets it for you. |
| `showFocusIndicator` | `boolean` | `true` | Draw a visible focus ring on the active point. |
| `focusIndicatorColor` | `string` | `'#2962FF'` | Colour of the focus ring. |
| `focusIndicatorSize` | `number` | `14` | Diameter of the focus ring, in CSS pixels. |
| `announceDataUpdates` | `boolean \| 'active' \| (paneIndex)=>boolean` | `'active'` (helper); `true` (standalone) | Which panes announce data updates, and how they combine (see below). |
| `pageStep` | `number` | `10` | Points to jump with `Page Up` / `Page Down`. |
| `dataScope` | `'all' \| 'visible'` | `'visible'` | Whether the on-demand summary and data-update announcements describe the visible range or the full data set (see below). |
| `priceFormatter` | `(value: number) => string` | chart `localization.priceFormatter`, else the active series price formatter | Formats values for announcements. |
| `timeFormatter` | `(time: Time) => string` | chart `localization.timeFormatter`, else a locale-aware date | Formats times for announcements (uses the chart's `localization.locale`). |
| `seriesLabel` | `(series, index) => string` | series `title`, else `Series N` | Accessible label for each series. |
| `describeChart` | `(points, seriesLabel) => string` | built-in summary | Generates the `Enter` / `Space` summary. |
| `messages` | `PartialAccessibilityMessages` | English `defaultMessages` | Overrides for the announced text — translate some or all of it (see Localization). |
| `lang` | `string` | chart `localization.locale` | BCP-47 `lang` set on the announced regions so screen readers use the right voice. |

Options can be changed at runtime. Use the controller's
`accessibility.applyOptions({ ... })` for chart-level changes (`chartTitle`,
`announceDataUpdates`, `messages`, `lang`, …): it updates every pane **and** the
shared update region together. A single primitive also has its own
`plugin.applyOptions({ ... })` for per-pane tweaks (e.g. `dataScope`), but that
does not reach the chart-level shared update region — use the controller for
`announceDataUpdates` / `messages` / `lang`.

### Scoping announcements to the visible range

Keyboard navigation always covers the whole series – the arrow keys page the
chart so every point is reachable regardless of this setting. `dataScope` only
controls what the *summaries* describe.

By default (`dataScope: 'visible'`) the on-demand summary (`Enter` / `Space`) and
the background data-update announcements describe only the points within the
current visible range – for example *"65 data points in view"*. This is the
recommended setting for charts with large data sets because it keeps those
summaries focused on what the user is currently inspecting. The update
announcement's *"Latest"* value is the one exception: it always reports the
series' newest bar – the bar the update actually changed – even when that bar
is outside the visible range.

Use `dataScope: 'all'` when you want the summary and update announcements to
describe the full data set, even if only part of the history is visible.

Per-point announcements always report the absolute position (*"Point 247 of
500"*) so the user knows where they are in the whole series.

### Announcing data updates

When a chart streams live data, several panes can update in the same tick. Each
pane keeps its own assertive region for navigation, but all *data-update*
announcements go through **one** polite region shared by the whole chart, so the
updates never talk over each other.

`announceDataUpdates` (on `addAccessibilityPlugin`) chooses which panes speak:

- `'active'` (default): only the **last-focused** pane announces (pane 0 until you
  focus one). Navigating the volume pane, for example, makes its updates the ones
  you hear; otherwise you hear the main pane.
- `true`: every pane announces; simultaneous updates are combined into a single
  message in pane order (*"Chart data updated. 3 series changed. …"*).
- `false`: no update announcements.
- `(paneIndex) => boolean`: decide per pane; the enabled panes are combined.

Switch this at runtime through the controller —
`accessibility.applyOptions({ announceDataUpdates: true })` — which reconfigures
the shared region's mode; a per-pane `plugin.applyOptions` cannot change it.

A directly-attached `AccessibilityPlugin` (without the helper) takes a plain
`boolean` here and uses its own polite region.

## Localization

Out of the box the announcements are English, but **numbers and dates follow the
chart's locale** and **every spoken string is translatable**.

**Numbers and dates** come from the chart's
[`localization`](https://tradingview.github.io/lightweight-charts/docs/next/api/interfaces/LocalizationOptions):
dates use `localization.locale`, the summary's percentage uses it via
`Intl.NumberFormat`, and if you set `localization.priceFormatter` /
`localization.timeFormatter` the announcements use those too. So a chart you have
already localized (see the
[Custom locale](https://tradingview.github.io/lightweight-charts/tutorials/demos/custom-locale)
and [Price format](https://tradingview.github.io/lightweight-charts/tutorials/customization/price-format)
tutorials) gets localized announcements for free. You can still override per
plugin with `priceFormatter` / `timeFormatter`.

**Strings** are supplied through the `messages` bundle. Every announced sentence
is a formatter function (so a translation controls word order and pluralisation);
atomic words are plain strings. Pass a partial override — anything you leave out
stays English:

```js
import { addAccessibilityPlugin } from './plugins/accessibility/accessibility';

addAccessibilityPlugin(chart, {
    chartTitle: 'Gráfico de precios',
    lang: 'es',
    messages: {
        ohlc: { close: 'cierre' }, // only some keys — the rest stay English
        point: ({ position, total, time, label, values }) =>
            `${label} ${values}, ${time}. Punto ${position} de ${total}.`,
        help: ({ multiSeries }) =>
            `Controles de teclado. Las flechas izquierda y derecha se mueven entre los puntos de datos. ${multiSeries ? 'Las flechas arriba y abajo cambian de serie. ' : ''}Intro o Espacio lee un resumen de la serie.`,
    },
});
```

`lang` sets the BCP-47 `lang` attribute on the announced regions so a screen
reader pronounces them with the right voice; it defaults to
`localization.locale`. `messages`/`lang` are uniform across panes. To switch
language at runtime, call `accessibility.applyOptions({ messages, lang })` on the
controller — it updates every pane and the shared update region together. A
complete, runnable Spanish bundle lives in the example
(`example/example.es.ts`, rendered by `example/index.es.html`).

The precedence for the overridable pieces:

- **value:** `priceFormatter` → chart `localization.priceFormatter` → series formatter
- **time:** `timeFormatter` → chart `localization.timeFormatter` → locale-aware date
- **summary:** `describeChart` (full override) → `messages.summary`
- **strings:** your `messages` entry → English `defaultMessages`

## Performance

The plugin uses an **active-point-only** strategy: it never mirrors every data
point into the DOM. Regardless of whether a series holds 500 or 50,000 bars each
pane adds only four DOM nodes (a semantic overlay, a visually-hidden
description, an assertive live region and a focus ring), plus one polite live
region shared across the whole chart for data-update announcements.

Data stays in sync through one `subscribeDataChanged` listener per series, so
scrolling and zooming do no data work at all – the focus ring is repositioned
with a couple of coordinate look-ups and nothing is read or copied. Data
changes are handled lazily too: a change is only noted when it happens. The
focused pane re-reads its active series right away (`series.data()` returns a
cloned array, so a read is O(n) in that series' length), an unfocused pane
defers that read until it is focused again, and update announcements read each
changed series once per debounced announcement. The work is therefore
proportional to how much the chart is actually being used, not to how often
the user scrolls or how often your data ticks.

## Notes & limitations

- This is an example/starting-point plugin (see the repository disclaimer). It
  targets line / area / candlestick / histogram series: OHLC series announce
  their open / high / low / close, value series announce their value, and exotic
  custom series may need the value extraction adapted via `priceFormatter` /
  `describeChart`.
- Series added to or removed from a pane at runtime are picked up automatically.
  Adding or removing whole **panes**, however, requires re-running
  `addAccessibilityPlugin` (or calling `controller.refresh()`) so the new panes
  get their own layer. Beware that removing a pane's **last** series removes the
  pane itself (the library prunes empty panes), so that seemingly series-level
  operation also needs a `refresh()`.
- Series in a pane do not need to share timestamps. Navigation is aligned by
  *time* on the chart's shared time scale: switching series with the up / down
  arrows keeps the focused time (the nearest point in the new series is
  selected and paged into view), and the visible-range scoping follows each
  series' own data.
- The plugin provides the semantic layer and keyboard model. Visual contrast and
  font-scaling (covered in the
  [Readability](https://tradingview.github.io/lightweight-charts/tutorials/a11y/readability)
  part of the tutorial) remain the responsibility of your chart theme.
- Always validate with real assistive technology (VoiceOver, NVDA) as part of
  your own accessibility testing before shipping.
