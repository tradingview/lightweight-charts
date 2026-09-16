# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release. Helpers shared by the official Lightweight Charts™ plugin
packages, extracted from the `plugin-examples` collection where each plugin
had copied them by hand.

### Added

- General helpers:
  - `assertions` — `ensureDefined`, `ensureNotNull`
  - `closest-index` — `ClosestTimeIndexFinder`
  - `delegate` — `Delegate`, `ISubscription`
  - `dimensions/candles` — `candlestickWidth`
  - `dimensions/columns` — `calculateColumnPositions`,
    `calculateColumnPositionsInPlace`, `ColumnPositionItem`
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
- Custom series infrastructure, for what every custom series plugin repeated:
  - `custom-series/renderer-base` — `CustomSeriesRendererBase`,
    `CustomSeriesDrawArgs`
  - `custom-series/visible-bars` — `forEachVisibleBar`, `mapVisibleBars`,
    `extendRange`, `visibleSegments`, `whitespaceGapCheck`, `barCoordinate`,
    `getConflationFactor`, `AcceptedInput`, `GapCheck`
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
- `custom-series/options-aware-series` — `createOptionsAwareSeries` gives a
  custom series' price-value builder synchronous access to the current options,
  and rebuilds the stored plot values when one of the declared `priceOptions`
  changes. It also retains the data the series accepted, whitespace included, as
  an `AcceptedInput`: a chronological array plus a `revision` that changes on
  every accepted mutation. The array is kept sorted incrementally, so a
  streaming `update()` costs a binary insert and a read costs nothing.
- `createWhitespaceSeries` builds on it for renderers that need explicit gaps.
  Its `GapCheck` reports whether two drawn bars are separated by whitespace of
  the series' own, rather than by another series' timestamps, and takes a
  `minGap` — the shortest contiguous run that counts as a gap — so a renderer
  can pass `getConflationFactor(data)` and have a run narrower than one
  conflation bucket absorbed into the bucket instead of splitting every bar into
  its own segment.
