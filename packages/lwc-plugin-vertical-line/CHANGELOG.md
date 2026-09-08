# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-vertical-line`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `VerticalLine` series primitive draws a full-height vertical line at a
  given time, with an optional label on the time axis. It is created with
  `new VerticalLine(time, options)` and takes the chart and the series from
  the series it is attached to.
- Options: `color`, `width`, `showLabel`, `labelText`, `labelBackgroundColor`,
  and `labelTextColor`, typed as `VerticalLineOptions`. The defaults are
  exported as `defaultOptions`.

### Deprecated

- `VertLine` and `VertLineOptions`, the names used in the `plugin-examples`
  collection, are exported as aliases of `VerticalLine` and
  `VerticalLineOptions`. The four-argument constructor,
  `new VertLine(chart, series, time, options)`, also still works and ignores
  its chart and series arguments.
