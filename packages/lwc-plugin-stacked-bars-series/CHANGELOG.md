# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- `createStackedBarsSeries` binds options before data ingestion and keeps plot values
  synchronized when scaling options change.
- First release as a standalone package, `@tradingview/lwc-plugin-stacked-bars-series`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `StackedBarsSeries` custom series draws stacked columns from the
  `values` array of each point. Negative values are stacked downwards from
  the base, so a mixed point stays contiguous.
- Styling options: per-segment `colors`, `base`, `columnWidthMode` with
  `widthPercent`, `segmentBorderColor`, `segmentBorderWidth`, `radius`,
  `stackOrder` and `percent` (100% stacked) mode.
- Per-point segment colour overrides through `colors` on the data item.
- `hitTest` reporting the hovered segment (`objectId` is the index of the
  value within the point), with the other segments dimmed while one is
  hovered, and a `conflationReducer` which sums each band. Both are used only
  by `lightweight-charts` 5.1 and later; the package still runs on 5.0.0.

### Fixed

- Measure the same reversed, percent-normalized, and offset stack that is drawn.

- Columns are one bitmap pixel wider: the toolkit column position is
  inclusive, so the width is `right - left + 1`. Neighbouring columns now
  leave the same one pixel gap the built-in histogram does.
- Autoscaling covers the whole run of a stack rather than `0` to the total, so
  a column containing negative values is no longer clipped.
- The first column after a whitespace gap is no longer widened or shifted to
  align with the column before the gap.
- A bar without a computed column position no longer aborts the rest of the
  paint.
- A price which falls outside the price scale no longer draws a segment to the
  top of the pane, and a value which is not finite no longer silently drops
  every segment above it.
