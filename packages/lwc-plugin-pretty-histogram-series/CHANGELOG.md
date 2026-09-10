# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- The `PrettyHistogramSeries` custom series draws a histogram with rounded outer
  corners.
- `createPrettyHistogramSeries`, the supported way to add the series. It reads
  the current options as the plot values are built, so `base` takes effect
  without setting the data again.
- Styling options: bar width as a share of the bar spacing (`widthPercent`),
  corner `radius`, series `color`, and per-point color overrides.
- `base`, the price the bars grow from, reported to the autoscale the way the
  built-in histogram series does, and `upColor` / `downColor` for two-tone bars
  coloured by their sign relative to it.
- `widthMode` (`'percent'` or `'histogram'`), `minColumnWidth`, `borderColor`,
  `borderWidth` and `roundInnerCorners`.
- `gradientColor`, fading the fill from the bar's color at `base` into a second
  color at the outer end.
- `highlightHovered`, which fades every bar except the hovered one, backed by
  `hitTest` reporting `bar-<index>` through the crosshair.
- `conflationReducer`, so that conflated points keep the later value instead of
  disabling conflation for the series. `hitTest` and `conflationReducer` are only
  called by Lightweight Charts™ 5.1 and later.
