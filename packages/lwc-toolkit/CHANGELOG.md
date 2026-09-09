# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- `custom-series/options-aware-series` creates series with synchronous option
  access and refreshes plot values when scaling options change.
- Initial release. Helpers extracted from the Lightweight Charts™ plugin
  examples, where they were previously copied into each plugin by hand:
  - `assertions` — `ensureDefined`, `ensureNotNull`
  - `closest-index` — `ClosestTimeIndexFinder`
  - `delegate` — `Delegate`, `ISubscription`
  - `dimensions/candles` — `candlestickWidth`
  - `dimensions/columns` — `calculateColumnPositions`,
    `calculateColumnPositionsInPlace`
  - `dimensions/common` — `BitmapPositionLength`
  - `dimensions/crosshair-width` — `gridAndCrosshairBitmapWidth`,
    `gridAndCrosshairMediaWidth`
  - `dimensions/full-width` — `fullBarWidth`
  - `dimensions/positions` — `positionsBox`, `positionsLine`
  - `min-max-in-range` — `UpperLowerInRange`
  - `plugin-base` — `PluginBase`
  - `simple-clone` — `cloneReadonly`
  - `time` — `convertTime`, `convertTimeUTC`, `displayTime`,
    `formattedDateAndTime`
- Custom series infrastructure, extracted from what every custom series
  plugin repeated:
  - `custom-series/renderer-base` — `CustomSeriesRendererBase`,
    `CustomSeriesDrawArgs`
  - `custom-series/visible-bars` — `forEachVisibleBar`, `mapVisibleBars`,
    `extendRange`, `visibleSegments`
  - `custom-series/stacking` — `cumulativeSum`, `stackLevels`,
    `stackedPlotValues`
  - `custom-series/line-paths` — `buildLinePath`, `buildStepLinePath`,
    `areaBetween`, `strokeStyledPolyline`
  - `canvas/round-rect` — `drawRoundRect`, `drawRoundRectWithBorder`,
    `clampCornerRadius`, `CornerRadii`
  - `line-style` — `setLineStyle`, `getDashPattern`, `LineStyle`
- Primitive infrastructure:
  - `pane-plugin-base` — `PanePluginBase`
  - `axis-label-view` — `AxisLabelView`, `AxisLabelSource`,
    `OFFSCREEN_LABEL_COORDINATE`
  - `dom/pane-element` — `paneContentElement`, `chartTableElement`
  - `dom/media-query` — `subscribeMediaQuery`, `mediaQueryMatches`,
    `HIGH_CONTRAST_QUERIES`, `REDUCED_MOTION_QUERY`
- `dimensions/columns`: `ColumnPositionItem` accepts an optional `time`
  (logical index); columns on either side of a whitespace gap are no longer
  aligned to each other, and `endIndex` is exclusive in every pass.
- `min-max-in-range` results are now actually cached.

### Fixed

- Keep options-aware series data synchronized when application data listeners throw or perform nested updates.

- Reconstruct extended bar coordinates from a visible anchor and respect conflation when finding gaps or aligning columns.
- Clamp inset corner radii and cap borders to the rectangle dimensions.
- Offset stacked plot values consistently from a nonzero baseline.
