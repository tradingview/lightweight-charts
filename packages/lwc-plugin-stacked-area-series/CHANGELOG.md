# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-stacked-area-series`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `StackedAreaSeries` custom series stacks the `values` array of each
  point into cumulative bands. Negative values are stacked back towards the
  base, so each band stays a single ribbon between two lines.
- `createStackedAreaSeries` is the supported way to add the series. It retains
  the whitespace passed through `setData`, `update` and historical corrections,
  so `gapHandling` breaks the bands at an explicit gap while timestamps
  contributed by other series never do. Under time-scale conflation a
  whitespace run narrower than one bucket is absorbed into the bucket, since it
  cannot be resolved at that bar spacing.
- The `StackedAreaSeries` pane view stays exported, for `chart.addCustomSeries`
  and for composing the renderer into another series. On its own it draws
  continuously: the host hands no whitespace to custom renderers, so gap
  handling needs the factory.
- Styling options: per-band `colors` — which now also carry an optional
  `areaBottom` gradient stop and per-band `lineWidth`, `lineStyle`,
  `lineVisible` and `areaVisible` — plus the series-wide `lineWidth`,
  `lineStyle`, `lineVisible`, `areaVisible`, `base`, `lineType`
  (`simple`/`step`/`curved`), `gapHandling` (`break`/`bridge`) and `percent`
  (100% stacked) mode.
- Per-point band colour overrides through `colors` on the data item.
- `hitTest` reporting the hovered band (`objectId` is the index of the band),
  with the other bands dimmed while one is hovered, and a `conflationReducer`
  which sums each band. Both are used only by `lightweight-charts` 5.1 and
  later; the package still runs on 5.0.0.

### Fixed

- Reject hover hits in whitespace gaps and outside the painted horizontal extent.
- Keep area fills visible after scrolling or zooming to an interior range and
  when data is conflated.
- No longer throws when the visible range is empty — every point scrolled off
  one side of the pane.
- No longer throws when the points do not all carry the same number of values.
  Shorter points are padded, so a longer point no longer drops its top band
  either.
- The bands and their lines now reach the edges of the pane instead of stopping
  at the first and last visible point.
- Autoscaling covers the whole run of a stack rather than `0` to the total, and
  a band containing negative values is drawn as a ribbon instead of a
  self-intersecting fill.
- Autoscaling honours `percent` and `base`, so a 100% stack added with
  `createStackedAreaSeries` scales to `base`…`base + 100` instead of to the raw
  totals, and changing either option rescales the series. It used to need an
  `autoscaleInfoProvider` supplying the range by hand.
- An empty `colors` array no longer throws; it falls back to the defaults.
- Line widths are scaled by the horizontal pixel ratio, as the library's own
  lines are.
