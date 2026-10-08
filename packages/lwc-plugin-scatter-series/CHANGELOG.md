# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 - 2026-10-08

First release.

### Added

- `createScatterChart`, a chart whose horizontal scale is a numeric X axis with
  nice, evenly spaced labels that never overlap and are chosen again for the
  part in view when the user zooms; its frozen defaults
  (`scatterChartDefaults`), and `ScatterHorzScaleBehavior` for building it with
  `createChartEx`.
- `createScatterSeries`, a custom series drawing a whole scatter dataset:
  points at their exact X, in groups with their own colour, opacity, size and
  marker shape, with per-point overrides and host fields kept on the points.
  Hidden groups leave drawing, hover and the price scale, but not the X axis.
- Data-driven bubble sizes (`sizeRange`, `sizeDomain`, `sizeScale` and
  `pointSizeLimits`), rings and open (`hollow`) markers, lines connecting the
  points of a group, X and Y baselines, an accent border around the plot, and
  pinned or automatic X and Y ranges, with `xFormatter` and `xMargins`.
- A hover API for host tooltips and legends: the hovered point's `objectId` in
  the chart's events, `pointById` and `hitTest` with the drawn geometry,
  `setHoveredPoint`, the batched `subscribeHoveredPointChange`, `groups()` and
  `setGroupVisible`, and optional hover styling.
- `xToCoordinate` and `coordinateToX`, for overlays of your own placed exactly
  as the points are drawn, and `sizeMapping()`, for a bubble-size legend.
- With scrolling or zooming switched on, the user's zoom kept through data
  refreshes and resizes, and the fit of the X range restored when the user
  zooms out to it (`fitXDomain` for a reset control of your own).
