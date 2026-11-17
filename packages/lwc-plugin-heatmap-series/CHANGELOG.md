# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 - 2026-11-13

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository, where it was
`HeatMapSeries`. The types are spelled `Heatmap…` now, after the package.

### Added

- The `HeatmapSeries` custom series draws a column of cells per point, each
  from `low` to `high` and colored by `cellShader(amount, range)`, where
  `range` is the range of the amounts in view.
- `createHeatmapSeries`, whose options type keeps `cellShader` a function so
  an inline shader is typed.
- `createColorScale({ stops, domain, steps })`, a shader that maps amounts
  onto a scale of colors, over the amounts in view unless given a domain,
  looked up from a table of `steps` colors worked out once.
- Options `cellShader`, `cellGap`, `cellBorderWidth` and `cellBorderColor`,
  with the defaults exported as `defaultOptions`; the price line and the last
  value label are off by default, and can be turned on. The gap between cells
  is an option of its own, no longer a transparent border, and the default
  shader ramps from faint at an amount of 0 to opaque at 100.
- Cells filled together by color, one path per color per paint, and only the
  cells of the points on screen that are on the pane.
- Cells and columns that abut with no seam and no overlap at every pixel
  ratio, a gap and a border rounded to device pixels along each axis and left
  out of a cell too small for them, and the border drawn as a frame inside
  the cell, so translucent cells show the chart through them.
- A cell whose shader color the canvas cannot parse is not drawn, rather than
  painted in the color of the cell before it; a shader that is not a function
  falls back to the default.
- `null` cells skipped, a point with no cell to draw, `cells: null` included,
  read as whitespace, and the price scale taking in both edges of every drawn
  cell, whichever is the higher, and no edge that is not finite.
- `hitTest` reporting the hovered cell, used by Lightweight Charts™ 5.2 and
  later. The package still runs on 5.0.0.
