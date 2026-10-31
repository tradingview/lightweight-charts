# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.1.0 - 2026-10-31

### Changed

- The package is published under the `@bishopbot` scope instead of
  `@tradingview`, and its metadata points at
  `https://github.com/bishop-bot/lightweight-charts`.
- The library peer dependency is `@bishopbot/lightweight-charts` (`^6.0.0`).
  The upstream `lightweight-charts` stays an optional peer dependency, so a
  project that already depends on the upstream 5.x line does not have to
  change it.
- The sources import the library and the toolkit under their new names.

## 1.0.0 - 2026-09-16

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- The `StackedBarsSeries` custom series draws stacked columns from the `values`
  array of each point. Negative values are stacked downwards from the base, so a
  mixed point stays contiguous.
- `createStackedBarsSeries`, the supported way to add the series. It reads the
  current options as the plot values are built, so `base`, `percent` and
  `stackOrder` take effect — and the series autoscales to match — without setting
  the data again.
- Styling options: per-segment `colors`, `base`, `columnWidthMode` with
  `widthPercent`, `segmentBorderColor`, `segmentBorderWidth`, `radius`,
  `stackOrder` and `percent` (100% stacked) mode.
- Per-point segment color overrides through `colors` on the data item.
- `hitTest` reporting the hovered segment (`objectId` is the index of the value
  within the point), with the other segments dimmed while one is hovered, and a
  `conflationReducer` which sums each segment. Both are used only by Lightweight
  Charts™ 5.1 and later; the package still runs on 5.0.0.
