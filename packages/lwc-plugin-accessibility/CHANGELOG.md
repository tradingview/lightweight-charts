# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-accessibility`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `addAccessibilityPlugin(chart, options)` chart-level helper takes
  `AccessibilityOptions`, attaches one `AccessibilityPlugin` pane primitive per
  pane and returns a controller with `applyOptions`, `refresh`, and `detach`.
  The chart is typed as `IChartApi`: the plugin is `Time`-only by design.
- `AccessibilityPlugin` for direct per-pane use, taking `AccessibilityPaneOptions`
  and the pane's index as a second constructor argument.
  `AccessibilityChartOptions` is kept as a deprecated alias of
  `AccessibilityOptions`.
- A semantic layer for each pane: a labeled, keyboard-focusable overlay with
  `role="application"`. Its `lw-chart-a11y-*` class names are public and stable.
- Keyboard navigation across data points and series, with `pageStep`, `zoomStep`
  and `minZoomSpan` for the jump and zoom amounts.
- ARIA-live announcements, with one shared polite region for data updates.
  `dataUpdates` (`mode`, `panes`, `debounceMs`) chooses which panes speak and how
  the changes are coalesced; `updateMaxSeries` caps how many are listed.
- A visible focus indicator (`showFocusIndicator`, `focusIndicatorColor`,
  `focusIndicatorSize`).
- Optional extras: a visible shortcuts overlay (`showShortcuts`) and
  high-contrast handling (`highContrast: boolean | 'auto'`,
  `onHighContrastChange`).
- Full localization. Numbers and dates follow the chart's `localization`
  settings. Every spoken string is translatable through the `messages` bundle
  and `lang`; `defaultMessages` is the frozen, read-only English bundle and
  `esMessages` ships a Spanish translation. `chartTitle` is optional and falls
  back to `messages.defaultChartTitle`.
- `describeChart(context)` replaces the built-in `Enter` / `Space` summary,
  receiving the scoped `points`, the `series`, its `label` and the `scope`.
- A "view as table" command (`T`): the active series rendered into a real
  `<table>` on demand — the WCAG text alternative for the chart — capped at
  `tableMaxRows` and closed with `Esc`.
- Custom series support: `valueAccessor` and `rangeAccessor` tell the plugin
  where a custom data item keeps its value and its high / low band.
- `timeFormat` (`'auto'` by default) follows the chart's
  `timeScale.timeVisible` / `secondsVisible`, so intraday bars no longer all
  announce the same date.
- `keyBindings` remaps or removes any command; the built-in letter shortcuts are
  also matched by physical key (`KeyH`, `KeyT`) for non-Latin layouts.
- Marker and price-line announcements (`markers`, `announcePriceLines`), and the
  visible range announced on `+` / `-` and — with `announceOnFocus` — on pane
  entry.
- `onAnnounce` (every spoken string), `onFocusChange` (the active point and
  series), `focusOnPointerDown` (pressing the pane focuses its layer) and
  `syncCrosshair` (the crosshair follows the keyboard).
- A sonification hook, `onSonify`, plus `createToneSonifier()` — a ready-made
  Web Audio handler that plays the focused point as a tone.
- The plugin's panels follow the host page's writing direction, so they sit on
  the leading side of a right-to-left page.

### Fixed

- `controller.detach()` after `chart.remove()` no longer detaches from a
  destroyed pane (the library raises an asynchronous "Object is disposed" on
  that path).
- Panes added or removed at runtime are picked up automatically, attaching and
  detaching only the difference instead of tearing every pane down: the focus,
  the announcer's active pane and the pane indices stay correct.
  `controller.refresh()` now does the same reconciliation.
- The `Enter` / `Space` summary reports the true extremes of an OHLC series from
  each bar's high / low instead of its close, and formats the change with the
  series formatter rather than an absolute-price one.
- Streaming data no longer clones a series on every tick: an `update` is applied
  through `dataByIndex`, and the announced in-view count comes from
  `barsInLogicalRange`.
- The axes' canvases are hidden from assistive technology by the chart-level
  helper (and re-hidden when the library recreates them) instead of by whichever
  pane happened to attach first.
- The pending initialisation retry is cancelled on detach; an explicit
  `undefined` passed to `applyOptions` no longer erases an option; a newly
  supplied `onHighContrastChange` is called with the current state; removing a
  series no longer silently moves the focus to another one; `Shift` chords are
  left to the screen reader.
