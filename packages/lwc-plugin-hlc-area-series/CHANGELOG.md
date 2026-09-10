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

- The series no longer throws when the whole dataset is scrolled out of view and
  the visible range is empty.
- The lines and the fills continue past the first and the last visible point, so
  they reach the edges of the pane instead of stopping short while panning.
- A run of whitespace breaks the lines and the fills instead of being bridged
  with a straight segment.
- A point missing `high` or `low` is whitespace, rather than being drawn with
  NaN coordinates. A point whose price falls off the price scale is skipped
  instead of losing the whole line.
- Line widths are scaled by the horizontal pixel ratio, as the library's own
  lines are, rather than by the vertical one.
