# The ten official plugins, and what each one teaches

Upstream: `packages/lwc-plugin-<name>/`. Published: `@tradingview/lwc-plugin-<name>`,
which ships the README and `dist/` (`.js` + `.d.ts`) but not the source. From
a repository that is not the upstream checkout, read the source on GitHub —
`https://github.com/tradingview/lightweight-charts/tree/master/packages/lwc-plugin-<name>/src`,
or the raw file URL under `raw.githubusercontent.com/tradingview/lightweight-charts/master/…` —
or clone once: `git clone --depth 1 https://github.com/tradingview/lightweight-charts /tmp/lightweight-charts`.

Each package has `src/`, a dev demo (`src/example/index.html`), a catalogue
preview (`src/example/preview.html`), `tests/{unit,graphics,interactions}`, a
README in the catalogue's shape and a CHANGELOG. Read the whole `src/` of the
nearest one before designing; they are small.

Every custom series below ships a `create<Name>Series(chart, options?,
paneIndex?)` factory as the supported entry point and keeps the
`<Name>Series` class exported for `chart.addCustomSeries` and composition.
The factory is where options-aware autoscale and whitespace detection live.

## Custom series

### `stacked-bars-series` — start here for any custom series

Stacked columns from a `values: number[]` per point. The shortest complete
custom series: `data.ts`, `options.ts`, `stack.ts` (pure maths, unit-tested),
`renderer.ts` (extends `CustomSeriesRendererBase`), the view, the factory.
Shows `createOptionsAwareSeries` with `['base', 'percent', 'stackOrder']` as
the price options; `stackedPlotValues` for autoscale over negatives;
`calculateColumnPositions` with `time` so columns either side of a gap are
not aligned to each other; `hitTest` returning the hovered segment index;
`conflationReducer` summing bands.

### `pretty-histogram-series` — one value per point, rounded, pixel-aligned

Rounded columns with `widthPercent`/`widthMode`, inner corners, a border and
a gradient. Shows `canvas/round-rect` with clamped radii, `base` reported in
`priceValueBuilder` so bars never clip at the pane edge, `highlightHovered`
dimming, a `conflationReducer` that keeps the later value, and the guard for
an empty visible range.

### `stacked-area-series` — bands, gaps and conflation together

Cumulative bands from `values[]`, negatives folding back to the base,
`gapHandling: 'break' | 'bridge'`, `percent` mode, per-band and per-point
colours, `lineType` simple/step/curved. Shows `createWhitespaceSeries` with
`['base', 'percent']`; `visibleSegments` with the `GapCheck` and
`getConflationFactor(data)` as `minGap`; `extendRange` + `barCoordinate` so
lines reach the pane edge with correct offscreen coordinates; `stackLevels`;
a `hitTest` that ignores whitespace gaps and unpainted extents. Its
interaction tests (`shared-timeline`, `whitespace-hit-test`,
`conflation-holidays`) are the model for testing gap behaviour.

### `hlc-area-series` — two lines with a band between

High, low and close lines, two-tone fill, gradients, step mode, hover
markers on the bar under the cursor. Shows `line-paths` (`buildLinePath`,
`buildStepLinePath`, `areaBetween`), skipping points whose prices fall off
the scale rather than drawing to `NaN`, `hitTest` by nearest bar, and a
`conflationReducer` taking highest high / lowest low / last close.

### `brushable-area-series` — a series plus its own interaction primitive

An area whose `brushRanges` (logical-index ranges) carry their own styles,
with `outsideStyle`, `basePrice` and gradient options; and
`BrushableAreaInteraction`, a series primitive that turns mouse drag,
one-finger drag and two-finger gestures into a range and reports it through
`activeRange()` as a `Delegate`. Read this for: matching ranges by *logical
index* rather than array index (they differ when another series starts
earlier), `strokeStyledPolyline` for a line whose style changes mid-way, and
how a series and a primitive cooperate without the series knowing about
pointers.

### `dual-range-histogram-series` — fixed pixel height, price-scale coexistence

Nested up/down columns of fixed pixel height on the zero line, or `scaleMode:
'price'` to autoscale like a normal series. Shows the problem of a series that
is *not* part of the autoscale: `keepPixelSeriesInView(chart, series)` reserves
room on the price scale and keeps doing so on resize. Also generic horizontal
scale support, role-keyed `colors`/`borderRadius`, and `normalize`.

### `rounded-candles-series` — a drop-in replacement for a built-in

Candlesticks with rounded bodies. Read for how to *match* the built-in:
the same colour option set and shorthand semantics, `candlestickWidth` for
the body, body and wick aligned on one pixel grid at every DPR,
`upDownMode`, per-point overrides, `conflationFactor` widening candles under
conflation, and a `radius` that may be a number or a function of bar spacing.

## Series primitives

### `vertical-line` — the model series primitive

A full-height line at a time, with a time-axis label, a badge on the line,
`snap: 'exact' | 'nearest'`, dragging with an `ew-resize` cursor. Shows
`PluginBase`, `AxisLabelView` (and the off-screen coordinate when the time is
not on the scale), `positionsLine` for a crisp line, `setLineStyle` for dash
patterns, `Delegate` for `timeChanged()`, hit-testing with a tolerance, and
drag ownership — only one line per chart suspends the chart's own scroll and
scale handling, and restores it exactly once. Its interaction tests cover
drag cancel, disabling during a drag, overlapping lines and pointer scope.

### `image-watermark` — the same idea as both primitive types

`ImageWatermark` (series primitive) and `ImageWatermarkPane` (pane primitive)
sharing options and a renderer. Read for: drawing nothing until an image has
decoded (and reporting failures through `onError` instead of throwing every
frame), positioning from the *pane's* size rather than the chart element,
`objectFit`/`position`/`padding` layout, `zOrder`, a decoded-image cache by
URL, and `detached()` cancelling a pending load.

## Pane primitives

### `accessibility` — DOM overlays and multi-pane lifecycle

A pane primitive per pane plus a chart-level `addAccessibilityPlugin(chart,
options)` controller. The reference for anything DOM-based: appending a
semantic layer to `paneContentElement(pane)`, following the pane by identity
through reordering (the constructor index is only a pre-build hint; the first
draw's canvas resolves the real pane), a single shared ARIA-live region,
`subscribeMediaQuery` for high contrast, message bundles and localisation,
keyboard handling on the overlay, and a controller that reconciles panes added
or removed at runtime. Also the largest test suite of the ten; its
`pane-reorder`, `mismatched-pane-index` and `announce-callback-throws`
interaction tests show how to assert on DOM state.

## `plugin-examples/` — breadth, not the standard

Upstream `plugin-examples/src/plugins/` holds unpublished proof-of-concept
plugins: tooltips and delta tooltips, a rectangle drawing tool, trend lines,
session highlighting, a heatmap series, lollipop, grouped bars, box-whisker,
background shading, price alerts, a volume profile, a partial price line,
crosshair highlighting, and anchored text. Good for seeing the shape of an
idea; they predate the toolkit and skip the tests and README the packages
carry, so use the official plugins for *how* and these for *what*. The ten
graduated plugins' folders there are redirect stubs to the packages.
