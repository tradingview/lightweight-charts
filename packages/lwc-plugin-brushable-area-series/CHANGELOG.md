# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-brushable-area-series`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `BrushableAreaSeries` custom series draws an area with a base style and
  any number of `brushRanges`, each with its own line and fill colors. A
  range's `style` is partial: properties left out fall back to the base style.
- The `outsideStyle` option styles the points outside every brush range, so a
  selection can be highlighted without swapping the series' base style.
- The `basePrice` option is the price the area is filled down to, clamped to
  the pane when it is off-screen. The area used to always reach the bottom of
  the pane.
- The `BrushableAreaInteraction` series primitive turns a mouse drag, a
  one-finger drag or a two-finger gesture into a brush range: it sets the
  series' `brushRanges` and reports the selection through `activeRange()`, as
  logical indices and as the times of the data points at each end. Set
  `brushRanges` from your own pointer handling instead if you prefer to own the
  interaction.
- Options `lineStyle` (per style, so a brush range can be dashed differently
  from the rest), `lineVisible`, `lineType` (straight, stepped or curved, with
  the fill following the same shape), `relativeGradient` and `invertFilledArea`,
  matching the built-in `AreaSeries` where they share a name.

### Fixed

- Reconstruct offscreen endpoints so interior viewport fills remain visible.
- Do not clear a completed mouse selection on an unrelated pointer departure.

- Brush ranges are matched against the time scale's logical index instead of the
  series' own array index, so they land in the right place whenever another
  series starts earlier or the data has gaps. They were documented as logical
  indices but only worked for the first series with data from logical 0.
- Gaps in the data break the line instead of being bridged by a straight
  segment across the whitespace.
- The line and the fill are drawn one bar past each edge of the visible range,
  so they leave the pane instead of stopping at the last visible point while the
  chart is panned.
- The fill gradient is anchored to the edge of the pane rather than to the
  outermost point in view, so it no longer changes as the chart is panned. The
  old behaviour is available as `relativeGradient: true`.
- Overlapping brush ranges: the last matching range wins, so a new selection
  covers the ones it is dragged over. The first one used to win.
- A point whose value is outside the current price scale breaks the line instead
  of being drawn at an invalid coordinate, and an empty or single-point visible
  range no longer reads past the end of the bar array.
- Line widths are scaled by the horizontal pixel ratio, as the chart's own lines
  are, and the joints between two style runs are rounded instead of showing a
  seam at `lineWidth: 3` and above.
