# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- The `DualRangeHistogramSeries` custom series draws nested up and down columns
  of a fixed pixel height on the zero line.
- `createDualRangeHistogramSeries`, the supported way to add the series. It reads
  the current options as the plot values are built, so `scaleMode` and
  `baseValue` take effect without setting the data again.
- Styling options `colors` and `borderRadius`, each keyed by column (`upOuter`,
  `upInner`, `downOuter`, `downInner`), plus `maxHeight`, `borderColor` and
  `borderWidth`.
- `scaleMode`: `'price'` reads the values as prices measured from `baseValue` and
  autoscales them like any other series, instead of the fixed pixel height.
- `keepPixelSeriesInView(chart, series, maxHeight?)`, which reserves room on the
  price scale for a `pixels` mode series and keeps doing so while the chart is
  resized.
- `normalize` (`'visible'`, `'all'` or a number), choosing what the column heights
  are scaled against in `pixels` mode, plus `gap` between the upward and the
  downward half, `widthPercent` and `baseValue`.
- Per-point column color overrides through `colors` on the data item.
- `highlightHovered`, which fades every point except the hovered one, backed by
  `hitTest` reporting `bar-<index>` through the crosshair.
- `conflationReducer`, so that conflated points keep the later value instead of
  disabling conflation for the series. `hitTest`, `conflationReducer` and
  `conflationFactor` are only used by Lightweight Charts™ 5.1 and later.
