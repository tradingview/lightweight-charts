# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-accessibility`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `addAccessibilityPlugin(chart, options)` chart-level helper attaches one
  `AccessibilityPlugin` pane primitive per pane and returns a controller with
  `applyOptions`, `refresh`, and `detach`.
- A semantic layer for each pane: a labeled, keyboard-focusable overlay with
  `role="application"`.
- Keyboard navigation across data points and series.
- ARIA-live announcements, with one shared polite region for data updates.
- A visible focus indicator.
- Optional extras: a visible shortcuts overlay (`showShortcuts`) and
  high-contrast handling (`highContrast`, `onHighContrastChange`).
- Full localization. Numbers and dates follow the chart's `localization`
  settings. Every spoken string is translatable through the `messages` bundle
  and `lang`.
