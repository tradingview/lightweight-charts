# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

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
- Per-point band colour overrides through `colors` on the data item.
- Autoscaling follows `percent` and `base`, so a 100% stack added with the
  factory scales to `base`…`base + 100` rather than to the raw totals.
- `hitTest` reporting the hovered band (`objectId` is the index of the band),
  with the other bands dimmed while one is hovered, and a `conflationReducer`
  which sums each band. Both are used only by Lightweight Charts™ 5.1 and later;
  the package still runs on 5.0.0.
