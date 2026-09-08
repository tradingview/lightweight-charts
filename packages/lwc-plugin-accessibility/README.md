# Accessibility

A drop-in accessibility layer for a Lightweight Charts™ chart. The plugin is
built on
[pane primitives](https://tradingview.github.io/lightweight-charts/docs/plugins/pane-primitives)
and helps your application meet
[WCAG 2.1 Level AA](https://www.w3.org/TR/WCAG21/).

Canvas-based charts are opaque to assistive technology. This plugin packages
the techniques from the
[accessibility tutorial](https://tradingview.github.io/lightweight-charts/tutorials/a11y/intro).
You get keyboard navigation, screen-reader announcements, and a visible focus
indicator without any manual wiring.

Use the chart-level helper for normal integration. It attaches one primitive
per pane. Each pane gets its own labeled, keyboard-focusable semantic layer.
The plugin handles every series in a pane, so multi-series and multi-pane
charts work out of the box.

## Installation

### npm

Install the package. It requires `lightweight-charts` `^5.0.0` in your
project:

```shell
npm install @tradingview/lwc-plugin-accessibility
```

Then import the plugin and add it to a chart:

```js
import { createChart, LineSeries } from 'lightweight-charts';
import { addAccessibilityPlugin } from '@tradingview/lwc-plugin-accessibility';

const chart = createChart(document.getElementById('chart'));
const series = chart.addSeries(LineSeries);
series.setData(myData);

const accessibility = addAccessibilityPlugin(chart, {
    chartTitle: 'Apple daily close',
});
```

### CDN

The plugin is published as ES modules. Map the library and the plugin to their
CDN builds with an import map:

```html
<script type="importmap">
{
  "imports": {
    "lightweight-charts": "https://unpkg.com/lightweight-charts@^5/dist/lightweight-charts.standalone.production.mjs",
    "@tradingview/lwc-plugin-accessibility": "https://unpkg.com/@tradingview/lwc-plugin-accessibility/dist/accessibility.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
import { createChart, LineSeries } from 'lightweight-charts';
import { addAccessibilityPlugin } from '@tradingview/lwc-plugin-accessibility';

const chart = createChart(document.getElementById('chart'));
const series = chart.addSeries(LineSeries);
series.setData(myData);

const accessibility = addAccessibilityPlugin(chart, {
    chartTitle: 'Apple daily close',
});
</script>
```

## Usage

Enable the plugin for every current pane with one chart-level call:

```js
import { createChart, LineSeries } from 'lightweight-charts';
import { addAccessibilityPlugin } from '@tradingview/lwc-plugin-accessibility';

const chart = createChart(document.getElementById('chart'));
const series = chart.addSeries(LineSeries);
series.setData(myData);

const accessibility = addAccessibilityPlugin(chart, {
    chartTitle: 'Apple daily close',
});
```

`chartTitle` is optional; without it every pane is announced with
`messages.defaultChartTitle` (*"Interactive financial chart"*), distinguished by
a *"Pane 2 of 2"* suffix. For a multi-pane chart, pass a title resolver instead:

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
directly as a pane primitive. It takes `AccessibilityPaneOptions` and, as a
second constructor argument, the index of the pane you attach it to (only needed
for a pane other than the first):

```js
import { AccessibilityPlugin } from '@tradingview/lwc-plugin-accessibility';

chart.panes()[1].attachPrimitive(
    new AccessibilityPlugin({ chartTitle: 'Volume' }, 1)
);
```

A directly attached primitive keeps its own polite live region and takes a plain
boolean `announceDataUpdates`; the chart-level `dataUpdates` settings only exist
on the helper.

## What it does

- **Semantic layer.** Each pane gets a labeled, keyboard-focusable overlay
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
  (`dataUpdates`, see below).
- **Visible focus indicator.** The focused pane receives an outline, and an
  optional focus ring is drawn over the active point. The point ring stays
  aligned with the canvas as you scroll or zoom.
- **Visible shortcuts & high contrast (opt-in).** With `showShortcuts: true`,
  sighted keyboard users get a "Press H" hint on focus and an `H`-toggled
  on-screen list of the controls. `highContrast` (default `'auto'`, following the
  OS) restyles the plugin's own focus ring and overlay, and `onHighContrastChange`
  lets you restyle the chart itself to match — for users who navigate by keyboard
  or need higher contrast but don't use a screen reader.

### Keyboard map

| Key | Action |
| --- | --- |
| `Tab` | Move focus between panes / out of the chart |
| `←` / `→` | Move to the previous / next data point |
| `↑` / `↓` | Switch to the previous / next series in the pane |
| `Page Up` / `Page Down` | Jump by `pageStep` points (default 10): `Page Up` forward in time, `Page Down` back — following the ARIA slider convention that `Page Up` increases the value |
| `Home` / `End` | Jump to the first / last point |
| `+` / `-` | Zoom the chart in / out |
| `Enter` / `Space` | Announce a summary of the active series |
| `H` | Announce the controls, and — when `showShortcuts` is on — show / hide the visible shortcuts panel |

## Options

All options are optional and have sensible defaults. `addAccessibilityPlugin`
takes `AccessibilityOptions`, a single `AccessibilityPlugin` takes
`AccessibilityPaneOptions`; the two differ only in the rows marked *chart-level*
below.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `chartTitle` | `string` — *chart-level:* `string \| (paneIndex) => string` | `messages.defaultChartTitle` | Accessible name of the pane region. |
| `showFocusIndicator` | `boolean` | `true` | Draw a visible focus ring on the active point. |
| `focusIndicatorColor` | `string` | `'#2962FF'` | Color of the focus ring. |
| `focusIndicatorSize` | `number` | `14` | Diameter of the focus ring, in CSS pixels. |
| `dataUpdates` | *chart-level only:* `{ mode: 'active' \| 'all' \| 'none'; panes?: (paneIndex) => boolean; debounceMs?: number }` | `{ mode: 'active' }` | Which panes announce data updates, and how they combine (see below). |
| `announceDataUpdates` | *pane-level only:* `boolean` | `true` | Whether this pane announces data updates. Set for you from `dataUpdates`. |
| `updateDebounceMs` | *pane-level only:* `number` | `1000` | Window over which data changes are coalesced before being announced. Use `dataUpdates.debounceMs` at chart level. |
| `updateMaxSeries` | `number` | `3` | Maximum number of changed series listed in one update announcement. |
| `pageStep` | `number` | `10` | Points to jump with `Page Up` / `Page Down`. |
| `zoomStep` | `number` | `0.2` | Fraction the visible range grows / shrinks per `+` / `-` keypress. |
| `minZoomSpan` | `number` | `2` | Smallest visible span, in bars, that zooming in will produce. |
| `dataScope` | `'all' \| 'visible'` | `'visible'` | Whether the on-demand summary and data-update announcements describe the visible range or the full data set (see below). |
| `priceFormatter` | `(value: number) => string` | chart `localization.priceFormatter`, else the active series price formatter | Formats values for announcements. |
| `timeFormatter` | `(time: Time) => string` | chart `localization.timeFormatter`, else a locale-aware date | Formats times for announcements (uses the chart's `localization.locale`). |
| `seriesLabel` | `(series, index) => string` | series `title`, else `Series N` | Accessible label for each series. |
| `describeChart` | `(context: DescribeChartContext) => string` | built-in summary | Generates the `Enter` / `Space` summary. The context carries `points` (already narrowed to `dataScope`), `series`, `label` and `scope`. |
| `messages` | `PartialAccessibilityMessages` | English `defaultMessages` | Overrides for the announced text — translate some or all of it (see Localization). |
| `lang` | `string` | chart `localization.locale` | BCP-47 `lang` set on the announced regions so screen readers use the right voice. |
| `showShortcuts` | `boolean` | `false` | Show a visible keyboard-shortcuts overlay (focus hint + `H`-toggled panel) for sighted keyboard users (see below). |
| `highContrast` | `boolean \| 'auto'` | `'auto'` | High-contrast styling for the plugin's own focus ring / outline / overlay. `'auto'` follows the OS `prefers-contrast` / `forced-colors`; pass a boolean to drive it from your own setting. |
| `onHighContrastChange` | `(enabled: boolean) => void` | — | Called when the resolved high-contrast state changes (and once on attach), so you can restyle the chart's own series / grid / font to match. |

Options can be changed at runtime. Use the controller's
`accessibility.applyOptions({ ... })` for chart-level changes (`chartTitle`,
`dataUpdates`, `messages`, `lang`, `highContrast`, …): it updates every pane
**and** the shared update region together. A single primitive also has its own
`plugin.applyOptions({ ... })` for per-pane tweaks (e.g. `dataScope`), but that
does not reach the chart-level shared update region — use the controller for
`dataUpdates` / `messages` / `lang`.

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

`dataUpdates` (on `addAccessibilityPlugin`) chooses which panes speak:

```js
addAccessibilityPlugin(chart, {
    dataUpdates: { mode: 'active', debounceMs: 1500 },
});
```

- `mode: 'active'` (the default): only the **last-focused** pane announces (pane 0
  until you focus one). Navigating the volume pane, for example, makes its updates
  the ones you hear; otherwise you hear the main pane.
- `mode: 'all'`: every pane announces; simultaneous updates are combined into a
  single message in pane order (*"Chart data updated. 3 series changed. …"*).
- `mode: 'none'`: no update announcements.
- `panes: (paneIndex) => boolean`: restricts announcements to the panes the
  predicate accepts, on top of `mode`.
- `debounceMs`: how long changes are coalesced before being announced (default
  `1000`). A live feed can tick far faster than a screen reader can speak.

Switch this at runtime through the controller —
`accessibility.applyOptions({ dataUpdates: { mode: 'all' } })` — which
reconfigures the shared region's mode; a per-pane `plugin.applyOptions` cannot
change it.

A directly-attached `AccessibilityPlugin` (without the helper) takes a plain
boolean `announceDataUpdates` with its own `updateDebounceMs`, and uses its own
polite region.

## Localization

Out of the box the announcements are English, but **numbers and dates follow the
chart's locale** and **every spoken string is translatable**.

**Numbers and dates** come from the chart's
[`localization`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LocalizationOptions):
dates use `localization.locale`, the summary's percentage uses it via
`Intl.NumberFormat`, and if you set `localization.priceFormatter` /
`localization.timeFormatter` the announcements use those too. So a chart you have
already localized (see the
[Custom locale](https://tradingview.github.io/lightweight-charts/tutorials/demos/custom-locale)
and [Price format](https://tradingview.github.io/lightweight-charts/tutorials/customization/price-format)
tutorials) gets localized announcements for free. You can still override per
plugin with `priceFormatter` / `timeFormatter`.

**Strings** are supplied through the `messages` bundle. Every announced sentence
is a formatter function (so a translation controls word order and pluralization);
atomic words are plain strings. Pass a partial override — anything you leave out
stays English:

```js
import { addAccessibilityPlugin } from '@tradingview/lwc-plugin-accessibility';

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
controller — it updates every pane and the shared update region together.

A complete Spanish bundle ships with the package as `esMessages`, both as a
ready-made translation and as a template for your own:

```js
import { addAccessibilityPlugin, esMessages } from '@tradingview/lwc-plugin-accessibility';

addAccessibilityPlugin(chart, { messages: esMessages, lang: 'es' });
```

`defaultMessages` is the English bundle. It is **frozen and read-only** — write a
translation by passing your own entries through `messages` (they are merged onto
`defaultMessages`), never by mutating it. `paneLabel` receives `paneIndex` and
`paneCount` alongside the title, so a translation can keep multi-pane titles
distinguishable, and `defaultChartTitle` is the fallback used when `chartTitle`
is unset.

The precedence for the overridable pieces:

- **value:** `priceFormatter` → chart `localization.priceFormatter` → series formatter
- **time:** `timeFormatter` → chart `localization.timeFormatter` → locale-aware date
- **summary:** `describeChart` (full override) → `messages.summary`
- **strings:** your `messages` entry → English `defaultMessages`

## Visible shortcuts and high contrast

These help users who navigate by keyboard, or need higher contrast, but don't use
a screen reader.

**Shortcuts overlay** — set `showShortcuts: true`. While the pane is focused a
small *"Press H for keyboard shortcuts"* hint is shown; `H` toggles an on-screen
panel listing the controls. It is `aria-hidden` (screen-reader
users already get the spoken `H` help) and its text comes from the `messages`
bundle (`shortcutsHint`, `shortcutsTitle`, `shortcuts`), so it localizes with the
rest. The overlay text is sized in `rem`, so it scales with the page/browser font.

**High contrast** — `highContrast` (`boolean | 'auto'`, default `'auto'`) controls
the plugin's *own* visuals (focus ring, focus outline, the overlay). `'auto'`
follows the OS `prefers-contrast` / `forced-colors` and updates live; to wire it
to your own app setting, pass a boolean and keep it in step with
`accessibility.applyOptions({ highContrast })`.

The plugin deliberately does **not** restyle the chart's series, grid or font —
that's the chart theme's job (see the
[Readability](https://tradingview.github.io/lightweight-charts/tutorials/a11y/readability)
tutorial). Instead it calls `onHighContrastChange(enabled)` whenever the state
changes (and once on attach) so you can apply your own high-contrast chart theme
in one place:

```js
addAccessibilityPlugin(chart, {
    showShortcuts: true,
    onHighContrastChange: enabled => {
        chart.applyOptions({ layout: { textColor: enabled ? '#000' : '#222' } });
        series.applyOptions({ lineWidth: enabled ? 4 : 2 });
    },
});
```

The example wires both of these up (the "Enable high contrast" and "Large font"
buttons).

## Performance

The plugin uses an **active-point-only** strategy: it never mirrors every data
point into the DOM. Regardless of whether a series holds 500 or 50,000 bars each
pane adds only a small fixed set of nodes (a semantic overlay, a visually-hidden
description, an assertive live region, a focus ring and — when `showShortcuts` is
on — the shortcuts hint and panel), plus one polite live region shared across the
whole chart for data-update announcements.

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

## CSS class hooks

Every element the plugin injects carries a stable class name, so you can restyle
the layer from your own stylesheet. These names are part of the public API and
will not change without a major version:

| Class | Element |
| --- | --- |
| `lw-chart-a11y-layer` | The focusable semantic overlay per pane (`role="application"`). |
| `lw-chart-a11y-description` | Visually hidden pane description (`aria-describedby` target). |
| `lw-chart-a11y-live-region` | Per-pane assertive region for navigation announcements. |
| `lw-chart-a11y-status-region` | Per-pane polite region, only present on a directly attached primitive. |
| `lw-chart-a11y-shared-status-region` | The single chart-level polite region created by `addAccessibilityPlugin`. |
| `lw-chart-a11y-focus-ring` | The visible focus ring drawn over the active point. |
| `lw-chart-a11y-shortcuts-hint` | The "Press H" hint (`showShortcuts`). |
| `lw-chart-a11y-shortcuts-panel` | The `H`-toggled shortcuts panel (`showShortcuts`). |

The plugin sets its own geometry and colors inline, so an inline style wins over
a plain rule — use `!important`, or restyle through the options where one exists
(`focusIndicatorColor`, `focusIndicatorSize`, `highContrast`).

## Notes & limitations

- The plugin targets line / area / candlestick / histogram series: OHLC series announce
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
- The API is typed for a `Time`-based chart (`IChartApi`), not the generic
  `IChartApiBase<HorzScaleItem>`. The announcements format UTC timestamps and
  business days and the navigation maps points through the `Time` scale, so every
  internal path assumes `Time`; a custom horizontal scale is not supported.
- Always validate with real assistive technology (VoiceOver, NVDA) as part of
  your own accessibility testing before shipping.
