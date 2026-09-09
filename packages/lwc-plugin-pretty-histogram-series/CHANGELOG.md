# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- `createPrettyHistogramSeries` binds options before data ingestion and keeps plot values
  synchronized when scaling options change.
- First release as a standalone package, `@tradingview/lwc-plugin-pretty-histogram-series`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `PrettyHistogramSeries` custom series draws a histogram with rounded
  outer corners.
- Styling options: bar width as a share of the bar spacing (`widthPercent`),
  corner `radius`, series `color`, and per-point color overrides.
- `base`, the price the bars grow from, reported to the autoscale the way the
  built-in histogram series does.
- `upColor` and `downColor` for two-tone bars coloured by their sign relative
  to `base`.
- `widthMode` (`'percent'` or `'histogram'`) and `minColumnWidth`.
- `borderColor`, `borderWidth` and `roundInnerCorners`.
- `gradientColor`, fading the fill from the bar's color at `base` into a second
  color at the outer end.
- `highlightHovered`, which fades every bar except the hovered one, backed by
  `hitTest` reporting `bar-<index>` through the crosshair.
- `conflationReducer`, so that conflated points keep the later value instead of
  disabling conflation for the series. `hitTest` and `conflationReducer` are
  only called by Lightweight Charts 5.1 and later.

### Fixed

- Keep gradients and outer corners oriented away from the baseline on inverted price scales.

- Include the current baseline in initial and updated plot values.

- Autoscale now includes `base`, so bars are no longer cut off at the edge of
  the pane and the `autoscaleInfoProvider` workaround the example used is gone.
- Bar widths and positions are pixel-consistent with the built-in histogram
  series, instead of alternating between overlapping and two-pixel gaps.
- One bar past the end of the visible range is no longer drawn.
- The renderer no longer draws to the top of the pane when a value has no
  coordinate, and skips non-finite values instead of painting NaN geometry.
- Nothing is drawn, and nothing throws, when the visible range is empty.
