# The official plugins, and what each one teaches

Upstream: `packages/lwc-plugin-<name>/`. Published: `@tradingview/lwc-plugin-<name>`,
which ships the README and `dist/` (`.js` + `.d.ts`) but not the source. From
a repository that is not the upstream checkout, read the source on GitHub —
`https://github.com/tradingview/lightweight-charts/tree/master/packages/lwc-plugin-<name>/src`,
or the raw file URL under `raw.githubusercontent.com/tradingview/lightweight-charts/master/…` —
or clone once: `git clone --depth 1 https://github.com/tradingview/lightweight-charts /tmp/lightweight-charts`.

Each package has `src/`, a dev demo (`src/example/index.html`), a catalog
preview (`src/example/preview.html`), `tests/{unit,graphics,interactions}`, a
README in the catalog's shape and a CHANGELOG. Read the whole `src/` of the
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

### `lollipop-series` — markers on stems, sized by the bar spacing

A dot at each value on a stem from `base`, drawn with `beginMarker` from
`canvas/markers`. Read for: sizes that are options but capped by the bar
spacing, and the dot also by a fixed maximum that keeps it within the price
scale's margins in a pane at least 100 px tall, since autoscale only knows the
values (`geometry.ts`, unit-tested); a stem kept at least one device pixel
wide; centering the dot on the stem as it was snapped to the pixel grid; and a
`hitTest` built on `custom-series/hit-test`: `nearestVerticalRange` for the
stems and `nearestBar` with `markerDistance` for the dots, so that each dot is
measured as drawn, reporting the dot as a `'point'` and the stem as a
`'range'`, since the chart prefers any point hit to a range hit whatever the
distance. It has no `conflationReducer`, so it sizes against `barSpacing`, not
`effectiveBarSpacing`. Its `hover-empty-space` interaction test shows the
library's own fallback: where the renderer's `hitTest` returns `null`, a
pointer inside a bar's slot between its plot values still reports the series
as hovered, without an `objectId`.

### `grouped-bars-series` — several values per point, side by side

A group of columns per point from `values[]`, with series and per-point
`colors`, a `base`, and `columnWidthMode`/`widthPercent` named as in
`stacked-bars-series`. Read for: one column count for the whole series, the
most values any point that draws a column has, so a column is as wide in
every group, counted once per data change by keying it on the
`AcceptedInput` revision that `createOptionsAwareSeries` hands the view, and
read when the renderer draws or hit tests rather than in the view's `update`,
which the chart calls while `setData` is still running, before the revision
moves; groups placed with `calculateColumnPositionsInPlace` in `histogram`
mode and `positionsLine` in `percent` mode, where they are all the same width
and never wider than the bar spacing covers; splitting each group into
whole-pixel columns that tile it exactly (`splitGroup` in `layout.ts`,
unit-tested), every column keeping at least a pixel and the tallest drawn
first once they share pixels; values equal to `base`, `null` and non-finite
values skipped like whitespace; and a `hitTest` that measures every column
within reach with `nearestBar`, naming the point and the column in
`objectId`.

### `stacked-area-series` — bands, gaps and conflation together

Cumulative bands from `values[]`, negatives folding back to the base,
`gapHandling: 'break' | 'bridge'`, `percent` mode, per-band and per-point
colors, `lineType` simple/step/curved. Shows `createWhitespaceSeries` with
`['base', 'percent']`; `visibleSegments` with the `GapCheck` and
`getConflationFactor(data)` as `minGap`; `extendRange` + `barCoordinate` so
lines reach the pane edge with correct offscreen coordinates; `stackLevels`;
a `hitTest` that ignores whitespace gaps and unpainted extents. Its
interaction tests (`shared-timeline`, `whitespace-hit-test`,
`conflation-holidays`) are the model for testing gap behavior.

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

### `background-shade-series` — a series that is only a background

Full-height columns behind each bar, colored by where the bar's value sits
between two colors. Read for: a custom series that stays out of the price
scale (`priceValueBuilder` returns `[NaN]`, so it never changes the autoscale
range, has no last value and is never hovered) and sits on an overlay price
scale of its own, set in `defaultOptions`, since a series at the bottom of the
order would otherwise set the number format of a shared axis; columns from
`fullBarWidthAfter`, each starting where the previous one ends, since two
edges rounded on their own can leave a seam; shades looked up in a table built when the
colors change, so no color string is made while drawing; parsing a CSS color
through a scratch canvas of its own (never the chart's context, whose
`fillStyle` a check would change), and spotting an invalid one; mixing colors
with premultiplied alpha; a factory that moves the series behind the others
with `setSeriesOrder(0)` where the host has it; and `globalAlpha` set inside
`save`/`restore`. Its `price-format-kept` interaction test compares two
charts, since a price axis never narrows once it has grown.

### `box-whisker-series` — a statistical shape on the candle grid

A box plot per point from named fields (`min`, `q1`, `median`, `q3`, `max`)
and `outliers`, with the five colors overridable on each point. Read for:
sizing every part from `candlestickWidth` and the grid line width in bitmap
pixels, with the same parity as the whisker so each part is centered on it;
the outliers in the autoscale values, so every dot stays in view; malformed
points (a non-finite or `null` number) read as whitespace in `isWhitespace`,
so they never reach the price scale; a factory that is a typed
`chart.addCustomSeries`, since no option changes the plot values; and a
`hitTest` on `nearestBar` that names the part and the point under the pointer
(`'box-<point>'`, `'outlier-<point>-<index>'`, …) in `objectId`, an outlier
reported as a `'point'` and the rest as `'range'`. It has no
`conflationReducer`: merging two box plots has no clear meaning.

### `heatmap-series` — many cells per point, filled by color

A column of `{ low, high, amount }` cells per point, colored by a
`cellShader(amount, range)` option. Read for: drawing many small shapes per
frame by collecting them per color and filling one path per color, which a
shader with few colors (`createColorScale` and its `steps`) makes pay off;
handing a function option the range of the values in view, worked out over
the visible bars, so colors need no maximum fixed in advance; checking a
color a user function returns on a scratch canvas before drawing with it,
since the canvas ignores an invalid fill and would reuse the last one;
cells rounded to pixels edge by edge, so neighbors share an edge, columns
from `fullBarWidthAfter`, and a gap and a border rounded per axis and left out
of a cell too small for them; rows off the pane skipped; a function-valued
option, and a factory options type that keeps it a function where the
library's `DeepPartial` would not; a cell-level `hitTest` limited to the
column whose slot holds the pointer, so its `objectId` indexes the point
`param.seriesData` reports, with no `hitTestData` so a pointer moving within a
cell repaints nothing (its `hover-stable` interaction test counts fills); and
seeded sample data shared by the demo, the preview and the unit tests.

### `rounded-candles-series` — a drop-in replacement for a built-in

Candlesticks with rounded bodies. Read for how to *match* the built-in:
the same color option set and shorthand semantics, `candlestickWidth` for
the body, body and wick aligned on one pixel grid at every DPR,
`upDownMode`, per-point overrides, `conflationFactor` widening candles under
conflation, and a `radius` that may be a number or a function of bar spacing.

### `scatter-series` — a numeric X axis instead of time

Scatter and bubble charts. `createScatterChart` builds the chart on a custom
horizontal scale behavior (`ScatterHorzScaleBehavior`) so that the X axis is a
plain number, and `createScatterSeries` draws the whole data set as one custom
series, in named groups with their own colors, marker shapes and connecting
lines, with bubble sizes driven by a data value. Read for a custom horizontal
scale, markers drawn and hit tested through `canvas/markers`, and a host API
for the tooltip and legend the plugin leaves to the page: `hoveredInfo.objectId`,
`pointById`, `subscribeHoveredPointChange`. The one official plugin that needs
`lightweight-charts` 5.2 (`^5.2.0`).

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
URL, and `detached()` canceling a pending load.

### `anchored-text` — the smallest two-class primitive

`AnchoredText` (series primitive) and `AnchoredTextPane` (pane primitive)
sharing one core, with no image to load and no interaction: the shape of
`image-watermark` reduced to its essentials. Read for: laying text out in the
media coordinate space from `measureText` (`layout.ts` is a pure function the
unit tests cover for all nine anchors), a renderer that returns `null` while
there is nothing to draw, `save`/`restore` around context changes, options
that accept a deprecated spelling (`'middle'`) on input and never return it,
and `mergeOptions` where one option (`lineHeight`) treats an explicit
`undefined` as a value.

### `session-highlighting` — per-bar background from the series' own data

`SessionHighlighting` shades a full-height column behind every bar with the
color a user function returns for its time. Read for: deriving per-bar state
from `series.data()` in `dataUpdated` and patching only the end of it on an
`'update'` scope. The scope covers more than append and replace: `pop()` and
an update that turns the last bar into whitespace shrink the data, and a
historical update can remove a bar from the middle or insert one there, so
the bar count decides the case: a shrink is only cut back when the kept last
entry still names the last bar, and a bar is only appended when it comes after
the last entry (both compared by the key `timestampOf` stores for each bar: numbers
pass through unchanged, as the time scale keys them, and business days and
date strings become the UTC timestamp of their day, so how the time is written
does not matter); otherwise every bar is recolored. Also read for mapping the
visible logical range back to data indices by binary search over `timeToIndex`
(so other series starting earlier do not shift the slice), `fullBarWidth` from
the time scale's `barSpacing` for columns as wide as the bar slots (each edge
rounded on its own, so neighbors can leave a 1 px seam where an edge falls on
a half pixel; `fullBarWidthAfter` rounds a shared edge once), and
`zOrder: 'bottom'` for a background.

## Pane primitives

### `accessibility` — DOM overlays and multi-pane lifecycle

A pane primitive per pane plus a chart-level `addAccessibilityPlugin(chart,
options)` controller. The reference for anything DOM-based: appending a
semantic layer to `paneContentElement(pane)`, following the pane by identity
through reordering (the constructor index is only a pre-build hint; the first
draw's canvas resolves the real pane), a single shared ARIA-live region,
`subscribeMediaQuery` for high contrast, message bundles and localization,
keyboard handling on the overlay, and a controller that reconciles panes added
or removed at runtime. Also the largest test suite of the official plugins; its
`pane-reorder`, `mismatched-pane-index` and `announce-callback-throws`
interaction tests show how to assert on DOM state.

## `plugin-examples/` — breadth, not the standard

Upstream `plugin-examples/src/plugins/` holds unpublished proof-of-concept
plugins: tooltips and delta tooltips, a rectangle drawing tool, trend lines,
price alerts, a volume profile, a partial price line,
and crosshair highlighting. Good for seeing the shape of an
idea; they predate the toolkit and skip the tests and README the packages
carry, so use the official plugins for *how* and these for *what*. The
graduated plugins' folders there are redirect stubs to the packages.
