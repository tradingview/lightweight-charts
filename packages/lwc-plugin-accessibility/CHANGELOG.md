# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- `addAccessibilityPlugin(chart, options)`, a chart-level helper that attaches
  one `AccessibilityPlugin` pane primitive per pane and returns a controller with
  `applyOptions`, `refresh` and `detach`. The chart is typed as `IChartApi`: the
  plugin is `Time`-only by design.
- `AccessibilityPlugin` for direct per-pane use, taking `AccessibilityPaneOptions`
  and the pane's index as a second constructor argument.
- A semantic layer for each pane: a labelled, keyboard-focusable overlay with
  `role="application"`. Its `lw-chart-a11y-*` class names are public and stable.
- Keyboard navigation across data points and series, with `pageStep`, `zoomStep`
  and `minZoomSpan` for the jump and zoom amounts, and `keyBindings` to remap or
  remove any command. The letter shortcuts are also matched by physical key
  (`KeyH`, `KeyT`), for non-Latin layouts.
- ARIA-live announcements through one shared polite region. `dataUpdates`
  (`mode`, `panes`, `debounceMs`) chooses which panes speak and how the changes
  are coalesced; `updateMaxSeries` caps how many series are listed.
- A "view as table" command (`T`): the active series rendered into a real
  `<table>` on demand — the WCAG text alternative for the chart — capped at
  `tableMaxRows` and closed with `Esc`.
- Full localization. Every spoken string is translatable through the `messages`
  bundle and `lang`; `defaultMessages` is the frozen English bundle and
  `esMessages` ships a Spanish translation. Numbers and dates follow the chart's
  own `localization` settings, and `chartTitle` falls back to
  `messages.defaultChartTitle`.
- Visual aids for sighted keyboard and low-vision users: a focus indicator
  (`showFocusIndicator`, `focusIndicatorColor`, `focusIndicatorSize`), a shortcuts
  overlay (`showShortcuts`) and high-contrast handling (`highContrast: boolean |
  'auto'`, `onHighContrastChange`).
- Hooks: `describeChart` replaces the built-in `Enter` / `Space` summary, and
  `onAnnounce`, `onFocusChange`, `focusOnPointerDown`, `syncCrosshair` and
  `onSonify` — with the ready-made `createToneSonifier()` — report or drive what
  the plugin is doing.
- Custom series support through `valueAccessor` and `rangeAccessor`, marker and
  price-line announcements (`markers`, `announcePriceLines`), `timeFormat`
  following the chart's own time settings, and `announceOnFocus` for the visible
  range on pane entry.
- The plugin's panels follow the host page's writing direction, so they sit on
  the leading side of a right-to-left page.

### Deprecated

- `AccessibilityChartOptions` is exported as an alias of `AccessibilityOptions`.
