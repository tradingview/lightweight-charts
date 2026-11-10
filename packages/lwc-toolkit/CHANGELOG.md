# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.1.0 - Unreleased

Helpers extracted from the scatter series plugin and from the custom series
plugins, which had been writing them for themselves.

### Added

- `options/merge` — `mergeOptions`, `cloneOptions`, `freezeOptions`,
  `isPlainObject`, `isUnsafeKey`: a deep merge of partial options, where a
  partial nested option changes only the keys it names instead of replacing
  the whole nested object; a copy that keeps functions and `undefined`; and
  deep-frozen defaults. Objects of no prototype and from other realms count
  as plain. `__proto__`, `constructor` and `prototype` keys are never copied.
  `null` replaces a value unless the caller passes `defaults`, which makes a
  `null` reset the value to its default.
- `canvas/markers` — `beginMarker`, `beginMarkerOffset`, `traceMarker`,
  `traceMarkerOffset`, `markerDistance`, `markerVertices`, `segmentDistance`,
  `MarkerShape`, `MarkerPath`, `MarkerContext`: circle, square, diamond and
  triangle markers, and the outline at a distance around them (hover rings,
  halos). `beginMarker` and `beginMarkerOffset` start a new path holding just
  the marker, for drawing markers one by one; a circle is then a bare `arc`,
  which Chromium draws faster, as an exact oval. `traceMarker` and
  `traceMarkerOffset` add the marker to the current path as a subpath of its
  own, so that many can be filled or stroked at once. `markerDistance` is the
  distance from a point to a marker as drawn, stroke included, for hit
  testing. Drawing and hit testing read the same vertices.
- `text/measure` — `textMeasureContext`, `createTextWidthCache`,
  `TextWidthCache`: a shared offscreen context, created on first use and
  `null` without a DOM, and a bounded cache of text widths.
- `chart/time-axis-labels` — `timeAxisLabelFont`,
  `tickMarkPixelsPerCharacter`, `tickMarkMaxLabelWidth`,
  `tickMarkCharactersForWidth`, `DEFAULT_TICK_MARK_MAX_CHARACTER_LENGTH`: the
  font the time axis draws its labels in, and the conversion between
  `timeScale.tickMarkMaxCharacterLength` and pixels that the time scale uses.
- `chart/interaction-flags` — `canUserMoveTimeScale`,
  `TIME_SCALE_MOVE_FLAGS`: whether `handleScroll` and `handleScale` let the
  user scroll or zoom the time scale, by the rule the library applies
  internally. A unit test pins the flag list to the library source.
- `chart/lifecycle` — `isChartRemoved`, `isSeriesAttached`: side-effect-free
  checks for a chart removed with `chart.remove()` and a series taken off with
  `chart.removeSeries`, for plugins that keep their own API in front of them.
- `scheduling/coalesced-task` — `createCoalescedTask`, `CoalescedTask`: work
  run at most once per microtask (or per frame) however often it is asked
  for, with `cancel()` for disposal. A queue that throws (no
  `requestAnimationFrame` on the server) throws from `schedule()` and leaves
  the task free to be scheduled again.
- `numbers` — `isFiniteNumber`, `finiteOr`, `nonNegativeOr`, `clampOpacity`:
  checks for numeric options from JavaScript callers, since the canvas ignores
  a `NaN` width or opacity without a word.
- `custom-series/compat` — `CustomSeriesHitTestResult`, `ConflationContext`:
  structural copies of the library's hit test result, exported from 5.2, and
  conflation context, from 5.1. Types only, so that a plugin can implement
  `hitTest` and `conflationReducer` and keep 5.0 as its floor.
- `custom-series/hit-test` — `distanceToRange`, `seriesHitTestTolerance`,
  `nearestBar`, `nearestVerticalRange`, `createHitTestDataCache`,
  `VerticalSpan`, `NearestBarHit`, `HitTestDataCache`: the parts of a
  renderer's `hitTest`. The series' `hitTestTolerance`, or the library's
  default of 3 px for an invalid value; the visible bar nearest the pointer
  within it, measured by a distance the renderer gives (`nearestBar`) or to
  the box of a bar that spans a vertical range (`nearestVerticalRange`), over
  the bars near the pointer found by binary search, so the cost does not grow
  with the bars on screen; and one `hitTestData` object per hovered item, so
  that the chart does not repaint on every pointer move.
- `dimensions/full-width` — `fullBarWidthAfter`: a full-width column that
  starts where its neighbor's ended. `fullBarWidth` rounds the edge two
  neighbors share once for each, and where the chart's inexact x coordinates
  put it on a half pixel the two can round apart, leaving a 1 px seam or
  overlap.
- `custom-series/visible-bars` — `effectiveBarSpacing`: the bar spacing times
  the conflation factor, so that a conflated bar is as wide as the slots it
  covers. Only for a series with a `conflationReducer`: the chart reports the
  factor to every custom series but conflates only those.

### Changed

- `line-style`: the `LineStyle` type names the library's own `LineStyle`
  enum as well. Types only, and no change in what compiles with the
  TypeScript the toolkit is built with (5.9), which accepted the enum already:
  it states that no cast is needed.
- `custom-series/line-paths`: a `PolylineStroke` can carry a `dashPattern`
  (from `getDashPattern`), which `strokeStyledPolyline` sets for that run and
  strokes with `butt` caps, so that a dotted run keeps its gaps. The context's
  dash and cap are put back afterwards, even when `styleAt` throws. Runs
  without one are stroked with the context's own dash and cap, as before.
- `custom-series/options-aware-series`: the options getter handed to the
  view keeps one copy of the series options, taken on its first call and
  dropped by `applyOptions`. It called the series' `options()`, which
  deep-copies them, every time: once per data point on `setData`, and for the
  bars near the pointer on most pointer moves, where the chart falls back to
  the plot values when a renderer's `hitTest` finds nothing.
- `custom-series/renderer-base`: `CustomSeriesDrawArgs.hitTestData` documents
  that a renderer's `hitTest` has to return the same `hitTestData` object while
  the same item stays hovered. The chart compares it by reference and
  repaints on every pointer move otherwise.

## 1.0.0 - 2026-09-16

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
