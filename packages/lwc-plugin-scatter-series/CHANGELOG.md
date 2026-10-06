# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release.

### Added

- `createScatterChart`, a chart whose horizontal scale is a numeric X axis
  with nice, evenly spaced labels that thin out on narrow charts, measured so
  that they never overlap, and chosen again for the part in view when the
  user zooms; its defaults (`scatterChartDefaults`), and
  `ScatterHorzScaleBehavior` for building the chart with `createChartEx`.
- With scrolling or zooming switched on, the user's zoom kept through data
  refreshes, option changes and resizes, and the X domain fitted exactly again
  when the user zooms out to all of it (`fitXDomain` to do it from a reset
  control).
- `createScatterSeries`, a custom series drawing a whole scatter dataset in one
  series: points at their exact X, any number of them sharing an X value.
- Groups of points with their own colour, opacity, size and marker shape
  (`circle`, `square`, `diamond`, `triangleUp`, `triangleDown`), a default
  ten-colour palette, and hidden groups left out of drawing, hover and the
  price scale while the X axis stays put. `groups()` returns the groups as
  drawn for a host legend, and `setGroupVisible` switches them.
- Per-point colour, opacity, size, marker shape, ring and hollow overrides,
  and host fields kept on the points through a generic point type.
- Data-driven sizes: `sizeRange`, `sizeDomain` and `sizeScale` (`linear` or
  `area`), and `sizeMapping()`, the mapping as drawn with a `sizeFor(value)`
  function, for a bubble-size legend.
- `pointSizeLimits`, the smallest and largest size of any point (5–50 px by
  default), down to dense plots of 1–3 px dots, which keep their colour as the
  ring narrows to a quarter of their size.
- Lines connecting the points of a group in data order, for tails on a
  relative rotation graph.
- X and Y baselines, an accent border on chosen sides of the plot, a pinned or
  automatic X range (`xRange`) with an `xFormatter` and optional `xMargins`,
  and a pinned or automatic Y range (`yRange`) that leaves room for the
  largest point.
- A ring around every point in the chart's background colour, following
  theme changes, or in a `strokeColor` and `strokeWidth` of your own, set on
  the series, a group or a point; and open (`hollow`) markers, outlined in
  their own colour, which `groups()` and `pointById` describe as drawn for a
  legend.
- A hover API for host tooltips and legends: the hovered point's `objectId` in
  the chart's `hoveredInfo`, `pointById` and `hitTest` with the point's
  drawn geometry, `hoveredPoint`, `setHoveredPoint` for highlighting from
  outside the chart, and `subscribeHoveredPointChange`, which follows the
  hovered point through data refreshes, resizes and rescaled axes, and reports
  `null` once when the series or its chart is removed.
- `xToCoordinate` and `coordinateToX`, the X counterparts of the underlying
  series' `priceToCoordinate` and `coordinateToPrice`: X values to pane
  coordinates and back, exactly as the points are drawn through zoom,
  `xMargins` and resizes, for overlays of your own — the README shows a
  series primitive shading regions of the plot with them.
- Optional hover styling: a hovered point grown by `hoveredSizeIncrease`
  pixels — and hit tested and reported at that size — and a ring around it
  (`hoveredRingWidth`, `hoveredRingColor`, `hoveredRingGap`) that follows its
  shape.
- A console warning, once, when a percentage or indexed-to-100 price scale is
  set: neither is meaningful on a scatter plot.
- `remove()`, safe before or after `chart.remove()`, which gives the chart back
  the options the series manages.
