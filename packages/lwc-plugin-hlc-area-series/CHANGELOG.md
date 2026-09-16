# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- The `HLCAreaSeries` custom series draws high, low, and close lines with a
  two-tone fill between them.
- `createHLCAreaSeries`, the supported way to add the series. It retains the
  whitespace passed through `setData`, `update` and historical corrections, so a
  gap breaks the lines and the fills while timestamps contributed by other series
  do not. The `HLCAreaSeries` pane view stays exported for `chart.addCustomSeries`
  and for composing the renderer into another series, but draws continuously on
  its own: gaps need the factory.
- Styling options: per-line colors and widths (`LineWidth`, `1`–`4`), and
  separate fill colors for the high–close (`highAreaColor`) and close–low
  (`lowAreaColor`) bands.
- Per-line dash patterns `highLineStyle`, `lowLineStyle` and `closeLineStyle`,
  taking the library's `LineStyle` values, and the visibility switches
  `highLineVisible`, `lowLineVisible`, `closeLineVisible` and `areaVisible`.
- `lineType: 'simple' | 'step'` draws the lines and the fills either straight or
  stepped, matching the built-in `LineType.WithSteps`.
- Gradient fills `highAreaTopColor` / `highAreaBottomColor` and
  `lowAreaTopColor` / `lowAreaBottomColor`, used when both stops of a pair are set.
- `hoverPointRadius` marks the high, low and close of the bar under the cursor,
  using the `hitTest` / `isHovered` support of Lightweight Charts™ 5.1 and later;
  `conflationReducer` merges conflated points as the highest high, the lowest low
  and the last close.

### Deprecated

- `areaTopColor` and `areaBottomColor` are accepted as aliases of `highAreaColor`
  and `lowAreaColor`.
