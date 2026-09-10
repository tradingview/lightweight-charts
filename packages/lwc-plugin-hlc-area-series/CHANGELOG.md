# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-hlc-area-series`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `HLCAreaSeries` custom series draws high, low, and close lines with a
  two-tone fill between them.
- `createHLCAreaSeries` is the supported way to add the series. It retains the
  whitespace passed through `setData`, `update` and historical corrections, so a
  gap breaks the lines and the fills while timestamps contributed by other
  series never do. Under time-scale conflation a whitespace run narrower than
  one bucket is absorbed into the bucket, since it cannot be resolved at that
  bar spacing.
- The `HLCAreaSeries` pane view stays exported, for `chart.addCustomSeries` and
  for composing the renderer into another series. On its own it draws
  continuously: the host hands no whitespace to custom renderers, so gaps need
  the factory.
- Styling options: per-line colors and widths (`LineWidth`, `1`–`4`), and
  separate fill colors for the high–close (`highAreaColor`) and close–low
  (`lowAreaColor`) bands. `areaTopColor` and `areaBottomColor` are accepted as
  deprecated aliases of the two fill colors.
- Per-line dash patterns: `highLineStyle`, `lowLineStyle` and `closeLineStyle`,
  taking the library's `LineStyle` values.
- Visibility switches: `highLineVisible`, `lowLineVisible`, `closeLineVisible`
  and `areaVisible`.
- `lineType: 'simple' | 'step'` draws the lines and the fills either straight or
  stepped, matching the built-in `LineType.WithSteps`.
- Gradient fills: `highAreaTopColor` / `highAreaBottomColor` and
  `lowAreaTopColor` / `lowAreaBottomColor`, used when both stops of a pair are
  set.
- `hoverPointRadius` marks the high, low and close of the bar under the cursor,
  using the `hitTest` / `isHovered` support of Lightweight Charts™ 5.1 and
  later.
- `conflationReducer` merges conflated points as the highest high, the lowest
  low and the last close.

### Fixed

- Preserve filled areas when data is conflated, and keep a whitespace run
  wider than one conflation bucket visible.
- The series no longer throws when the whole dataset is scrolled out of view and
  the visible range is empty.
- The lines and the fills continue past the first and the last visible point, so
  they reach the edges of the pane instead of stopping short while panning.
- A point missing `high` or `low` is whitespace, rather than being drawn with
  NaN coordinates. A point whose price falls off the price scale is skipped
  instead of losing the whole line.
- Line widths are scaled by the horizontal pixel ratio, as the library's own
  lines are, rather than by the vertical one.
