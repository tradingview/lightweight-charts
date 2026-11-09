# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- The `LollipopSeries` custom series draws each value as a dot at the end of a
  stem drawn from a base line, up for values above it and down for values below.
- `createLollipopSeries`, the supported way to add the series. It reads the
  current options as the plot values are built, so `base` is part of the
  autoscale range from the first `setData`, and changing it rescales the series
  without setting the data again.
- Options `base`, `lineWidth` and `markerSize`, the diameter of the dot, with
  the defaults exported as `defaultOptions`.
- Per-point `color` overriding the series color for that point's stem and dot.
- Stems and dots that shrink with the bar spacing as the chart is zoomed out,
  and dots no larger than 20 px, so that the price scale's default margins
  keep them in view in a pane at least 100 px tall.
- `hitTest` reporting the lollipop under the pointer, used by Lightweight
  Charts™ 5.2 and later. The package still runs on 5.0.0.
