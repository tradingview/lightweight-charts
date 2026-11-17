# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 - 2026-11-13

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository, where it was
`WhiskerBoxSeries`.

### Added

- The `BoxWhiskerSeries` custom series draws a box plot per point from its
  `min`, `q1`, `median`, `q3` and `max`, with a dot for each value in
  `outliers`.
- `createBoxWhiskerSeries`, which adds the series with its data and options
  types kept, typed `BoxWhiskerSeriesApi`.
- Options `whiskerColor`, `lowerBoxColor`, `upperBoxColor`, `medianColor` and
  `outlierColor`, with the defaults exported as `defaultOptions`, and the same
  five colors on a point overriding the series' for it.
- Box plots sized from the library's candlestick widths and centered on the
  whisker in whole device pixels, with outliers drawn at every zoom level and
  part of the autoscale range.
- Points without five finite numbers, `null` included, read as whitespace,
  and `null` outliers as none.
- `hitTest` reporting the hovered box, median, whisker or outlier of a point,
  used by Lightweight Charts™ 5.2 and later. The package still runs on 5.0.0.
