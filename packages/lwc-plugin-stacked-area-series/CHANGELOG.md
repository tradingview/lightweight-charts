# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.1.1 - 2026-10-31

### Fixed

- The upstream `lightweight-charts` peer dependency is marked optional again
  (`peerDependenciesMeta`). Without it, npm treats it as required and installs
  the upstream 5.x library next to the fork's, which the package does not use.

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

- The `StackedAreaSeries` custom series stacks the `values` array of each point
  into cumulative bands. Negative values are stacked back towards the base, so
  each band stays a single ribbon between two lines.
- `createStackedAreaSeries`, the supported way to add the series. It retains the
  whitespace passed through `setData`, `update` and historical corrections, so
  `gapHandling` breaks the bands at an explicit gap while timestamps contributed
  by other series do not. The `StackedAreaSeries` pane view stays exported for
  `chart.addCustomSeries` and for composing the renderer into another series, but
  draws continuously on its own: gap handling needs the factory.
- Styling options: per-band `colors`, each carrying an optional `areaBottom`
  gradient stop and its own `lineWidth`, `lineStyle`, `lineVisible` and
  `areaVisible`, plus the series-wide `lineWidth`, `lineStyle`, `lineVisible`,
  `areaVisible`, `base`, `lineType` (`simple`/`step`/`curved`), `gapHandling`
  (`break`/`bridge`) and `percent` (100% stacked) mode.
- Per-point band color overrides through `colors` on the data item.
- Autoscaling follows `percent` and `base`, so a 100% stack added with the
  factory scales to `base`…`base + 100` rather than to the raw totals.
- `hitTest` reporting the hovered band (`objectId` is the index of the band),
  with the other bands dimmed while one is hovered, and a `conflationReducer`
  which sums each band. Both are used only by Lightweight Charts™ 5.1 and later;
  the package still runs on 5.0.0.
