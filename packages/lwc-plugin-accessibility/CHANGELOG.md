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
