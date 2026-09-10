# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-dual-range-histogram-series`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `DualRangeHistogramSeries` custom series draws nested up and down
  columns of a fixed pixel height on the zero line.
- Styling options: `colors` and `borderRadius`, each keyed by column
  (`upOuter`, `upInner`, `downOuter`, `downInner`), and `maxHeight`.
- `borderColor` and `borderWidth` for a real, configurable column border.
- `scaleMode`: `'price'` reads the values as prices measured from `baseValue`
  and autoscales them like any other series, instead of the fixed pixel height.
- `keepPixelSeriesInView(chart, series, maxHeight?)`, which reserves room on
  the price scale for a `pixels` mode series and keeps doing so while the chart
  is resized. It replaces the `ResizeObserver` the README used to describe.
- `normalize` (`'visible'`, `'all'` or a number), choosing what the column
  heights are scaled against in `pixels` mode.
- `gap` between the upward and the downward half, `widthPercent`, and
  `baseValue`.
- Per-point column color overrides through `colors` on the data item.
- `highlightHovered`, which fades every point except the hovered one, backed by
  `hitTest` reporting `bar-<index>` through the crosshair.
- `conflationReducer`, so that conflated points keep the later value instead of
  disabling conflation for the series. `hitTest`, `conflationReducer` and
  `conflationFactor` are only used by Lightweight Charts 5.1 and later.

### Fixed

- Columns are one pixel wider: the toolkit's column width is inclusive, so
  `right - left` left a two-pixel gap and columns never abutted.
- The fake `'transparent'` border, which shrank every rectangle by half a pixel
  on all sides — including at the base line — and never actually stroked
  anything, is gone.
- No division by zero when the largest value is `0`: the series draws nothing
  instead of painting NaN geometry.
- Values which are not finite are skipped instead of corrupting the point.
- The corner radius is scaled by the horizontal pixel ratio, the same ratio the
  width it is clamped against uses, so corners are no longer over-rounded on
  high-density displays.
- Column widths are conflation aware (`conflationFactor`), and the column
  alignment is no longer carried across a gap of whitespace.
- Nothing is drawn, and nothing throws, when the visible range is empty.
