# `@tradingview/lwc-toolkit`, module by module

Every module is its own sub-path export: `@tradingview/lwc-toolkit/<module>`.
There is no root import. This file describes the shape and the reason, not
every overload: verify signatures against
`node_modules/@tradingview/lwc-toolkit/dist/<module>.d.ts`, whose doc comments
are the module's documentation.

"Read:" names the official plugin whose source shows the module used for
real. Upstream that is `packages/lwc-plugin-<name>/src/<file>`; from any other
repository fetch
`https://raw.githubusercontent.com/tradingview/lightweight-charts/master/packages/lwc-plugin-<name>/src/<file>`
(the published package ships `dist/` only).

## Custom series

### `custom-series/renderer-base` — `CustomSeriesRendererBase`, `CustomSeriesDrawArgs`, `CanvasRenderingTarget2D`

Base class for a custom series renderer. `update(data, options)` stores what
the chart hands over; `draw(target, priceConverter, isHovered, hitTestData)`
guards against a missing data set or an empty visible range and then calls
your `drawImpl(scope, args)` inside `useBitmapCoordinateSpace`. `args` is
`{ data, options, priceToCoordinate, from, to, isHovered, hitTestData }`,
where `from`/`to` are the visible range clamped to the bars array.

Reach for it because the guards are exactly where a hand-written renderer
throws when the whole dataset is scrolled off screen. It also re-exports the
`CanvasRenderingTarget2D` type so the plugin need not depend on `fancy-canvas`.

Read: `stacked-bars-series/src/renderer.ts` (short), `hlc-area-series/src/renderer.ts`.

### `custom-series/visible-bars` — `forEachVisibleBar`, `mapVisibleBars`, `extendRange`, `visibleSegments`, `whitespaceGapCheck`, `barCoordinate`, `getConflationFactor`, `GapCheck`, `AcceptedInput`

- `forEachVisibleBar(data, fn)` / `mapVisibleBars(data, fn)` visit only
  `data.visibleRange`; `fn` receives the bar and its *absolute* index into
  `data.bars`, which is what per-index option lookups use.
- `extendRange(range, length, by = 1)` widens a range by `by` bars each side,
  clamped, so a line's first and last segments leave the pane.
- `visibleSegments(bars, range, isGap?)` splits a range into runs of
  increasing logical index, breaking where `isGap(left, right)` says so. A
  jump in logical index alone is **not** a gap — other series can own those
  indices — so without a predicate the range is one run.
- `whitespaceGapCheck(readInput, logicalIndex, isWhitespace)` builds that
  predicate from the series' accepted input. Its `GapCheck(left, right,
  minGap = 1)` is true when the *contiguous* whitespace between two drawn
  bars is at least `minGap` logical indices long. Renderers pass
  `getConflationFactor(data)` as `minGap`.
- `barCoordinate(bar, anchor, barSpacing)` reconstructs a media `x` for a bar
  whose own `x` is stale (it was off screen) from a visible anchor bar.
- `getConflationFactor(data)` is `data.conflationFactor`, or 1 on hosts
  before 5.1.

Read: `stacked-area-series/src/renderer.ts` for all of them together.

### `custom-series/options-aware-series` — `createOptionsAwareSeries`, `createWhitespaceSeries`, `OptionsAwareSeries`

Factories that wrap `chart.addCustomSeries` so a series can do two things a
plain `ICustomSeriesPaneView` cannot:

- **Read options in `priceValueBuilder`.** The chart calls the builder at
  `setData`, before any `update(data, options)`, so a plain view has only its
  defaults there. `createOptionsAwareSeries(chart, createView, defaults,
  options, priceOptions, paneIndex?)` passes `createView` an options getter
  bound to the real series, and re-ingests the retained data whenever one of
  `priceOptions` changes through `applyOptions`. Use it whenever an option
  changes what a value *means* — a base, percent mode, a scale mode.
- **Know its own whitespace.** The wrapper retains a copy of the accepted
  input (the host's `data()` exposes fulfilled points only) as an
  `AcceptedInput`: a chronological array plus a `revision`, kept sorted
  incrementally so a streaming `update` is a binary insert.
  `createWhitespaceSeries(chart, createView, defaults, options,
  priceOptions?, paneIndex?)` builds on it and hands `createView` a ready
  `GapCheck` plus the options getter.

The returned API keeps its identity in chart events; `setData`, `update`,
`pop` and `applyOptions` are wrapped, everything else is the host's.

Read: `stacked-area-series/src/stacked-area-series.ts` (both concerns),
`stacked-bars-series/src/stacked-bars-series.ts` (options only).

### `custom-series/stacking` — `cumulativeSum`, `stackLevels`, `stackedPlotValues`

Running totals of a values array; the band boundaries of a stack drawn from
a `base` (negative values fold back towards it, so bands never overlap); and
`[min, max, total]` for `priceValueBuilder`, where min and max are taken over
the running totals *and* the base so a stack with negatives stays in view.

Read: `stacked-area-series/src/stacked-area-series.ts`, `stacked-bars-series/src/stack.ts`.

### `custom-series/line-paths` — `buildLinePath`, `buildStepLinePath`, `areaBetween`, `strokeStyledPolyline`

`Path2D` builders in bitmap space: a polyline over a bar range with an
accessor for `y`, its stepped variant, the closed area between two such
lines (for bands and stacks), and a polyline whose colour changes along its
length without a visible seam (adjacent runs share their boundary bar).

Read: `hlc-area-series/src/renderer.ts`, `brushable-area-series/src/renderer.ts`.

## Primitives

### `plugin-base` — `PluginBase`

Series-primitive base: holds `chart` and `series` from `attached`, exposes
`requestUpdate()`, and throws if `chart` is read before attach. Subclasses
that override `attached`/`detached` call `super`.

Read: `vertical-line/src/vertical-line.ts`, `image-watermark/src/image-watermark.ts`.

### `pane-plugin-base` — `PanePluginBase<T>`

The same for a pane primitive: `chart` and `requestUpdate()`; there is no
series. Read: `accessibility/src/pane-primitive.ts`.

### `axis-label-view` — `AxisLabelView`, `AxisLabelSource`, `OFFSCREEN_LABEL_COORDINATE`

An `ISeriesPrimitiveAxisView` over a source of callbacks (`coordinate`,
`text`, `textColor`, `backColor`, `visible`, `tickVisible`). Returns the
off-screen coordinate when the source has none, so the axis draws nothing
rather than a stray label at 0.

Read: `vertical-line/src/vertical-line.ts`.

### `dom/pane-element` — `paneContentElement`, `chartTableElement`

The pane's canvas wrapper cell, to append a DOM overlay to, and the chart's
table element. Pane widgets reuse rows when panes move, so hold the pane API
by identity and re-resolve the element on `updateAllViews`.

Read: `accessibility/src/dom/pane-dom.ts`.

### `dom/media-query` — `subscribeMediaQuery`, `mediaQueryMatches`, `HIGH_CONTRAST_QUERIES`, `REDUCED_MOTION_QUERY`

Shared, SSR-safe `matchMedia` subscriptions (no `window` at import time).
Read: `accessibility/src/high-contrast.ts`.

## Pixel-perfect dimensions

All return bitmap-space `{ position, length }` (`BitmapPositionLength`, from
`dimensions/common`), computed the way the chart's own renderers do so a
plugin lines up with built-in series at every device pixel ratio.

| Module | Export | Use |
| --- | --- | --- |
| `dimensions/positions` | `positionsLine(centre, pixelRatio, width)`, `positionsBox(a, b, pixelRatio)` | a crisp line of a given CSS width; a box between two coordinates |
| `dimensions/columns` | `calculateColumnPositions(items, barSpacing, pixelRatio)`, `…InPlace` | evenly spaced columns with the histogram's gap; items may carry `time` (logical index) so a gap is not bridged |
| `dimensions/candles` | `candlestickWidth(barSpacing, pixelRatio)` | the body width the built-in candlestick uses |
| `dimensions/full-width` | `fullBarWidth(x, halfSpacing, pixelRatio)` | a bar filling its whole slot |
| `dimensions/crosshair-width` | `gridAndCrosshairMediaWidth`, `gridAndCrosshairBitmapWidth` | line widths matching the grid |

Read: `rounded-candles-series/src/renderer.ts`, `pretty-histogram-series/src/renderer.ts`.

## Canvas and style

### `canvas/round-rect` — `drawRoundRect`, `drawRoundRectWithBorder`, `clampCornerRadius`, `CornerRadii`

Rounded rectangles in bitmap space, with per-corner radii, radius clamping
to the rectangle's size, and an inset border that does not shrink the fill.
Read: `pretty-histogram-series/src/renderer.ts`, `dual-range-histogram-series/src/renderer.ts`.

### `line-style` — `setLineStyle`, `getDashPattern`, `LineStyle`

The chart's own dash patterns for a renderer that receives no drawing utils
(custom series renderers before 5.1, primitives on some hosts). The toolkit's
`LineStyle` enum has the library's values, so cast between them.
Read: `vertical-line/src/vertical-line.ts`.

## General

| Module | Export | Use |
| --- | --- | --- |
| `assertions` | `ensureDefined`, `ensureNotNull` | narrow or throw, for state that must exist after attach |
| `delegate` | `Delegate`, `ISubscription` | a small subscribe/fire event; expose the `ISubscription` half publicly |
| `time` | `convertTime`, `convertTimeUTC`, `displayTime`, `formattedDateAndTime` | `Time` (string, business day, timestamp) to a number or display string |
| `closest-index` | `ClosestTimeIndexFinder` | cached binary search for the index at or after a time |
| `min-max-in-range` | `UpperLowerInRange` | cached extremes over a range, for autoscale providers |
| `simple-clone` | `cloneReadonly` | deep clone that drops readonly-ness, for option defaults |
