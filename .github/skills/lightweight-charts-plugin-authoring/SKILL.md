---
name: lightweight-charts-plugin-authoring
description: >-
  Use when creating, extending, debugging or publishing a Lightweight Charts™
  plugin — a custom series, a series primitive or a pane primitive — or when
  turning a chart idea ("I want the chart to show/draw X") into a working
  plugin. Covers choosing the plugin type, scaffolding with create-lwc-plugin,
  building on @tradingview/lwc-toolkit instead of hand-rolled helpers, which of
  the ten official plugin packages to read as the reference implementation,
  where the docs are, and the autoscale, whitespace, visible-range, hit-test
  and conflation mistakes every plugin author makes once. Reach for it whenever
  the user mentions a custom series, primitive, renderer, drawing on the chart
  canvas, lwc-plugin, plugin-examples, the toolkit, or the plugin catalogue —
  even if they never say the word "plugin".
---

# Writing a Lightweight Charts™ plugin

This skill is about *authoring* plugins. For questions about using the chart
itself — series, scales, markers, data, wrappers — use the sibling
`lightweight-charts` skill; the two are designed to be installed together.

## Where you are, and where the sources are

This skill is used in two places, and the same question has a different
answer in each. Detect which before looking anything up:

```sh
# upstream checkout of lightweight-charts itself?
test -f pnpm-workspace.yaml && test -d packages/lwc-toolkit && echo upstream || echo "a plugin project or other repo"
```

**In a plugin project or any other repository** (the common case):

| Looking for | Where |
| --- | --- |
| the library's API | `node_modules/lightweight-charts/dist/typings.d.ts`; if it is not installed, the released typings are hosted at `https://tradingview.github.io/lightweight-charts/lightweight-charts.d.ts` |
| the toolkit's API | `node_modules/@tradingview/lwc-toolkit/dist/<module>.d.ts` — the `.d.ts` carry the doc comments, so they read as documentation |
| a reference plugin's **source** | not in `node_modules` (packages ship `dist/` only). Fetch it from GitHub: `https://raw.githubusercontent.com/tradingview/lightweight-charts/master/packages/lwc-plugin-<name>/src/<file>`, or clone once and read locally: `git clone --depth 1 https://github.com/tradingview/lightweight-charts /tmp/lightweight-charts` |
| the docs | every docs page is served as Markdown by appending `.md` to its URL, e.g. `https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series.md`. `https://tradingview.github.io/lightweight-charts/llms.txt` lists every page; `docs_map.md` beside it lists their headings too |

**In the upstream checkout:** `dist/typings.d.ts` (or `src/`) for the library,
`packages/lwc-toolkit/src/` for the toolkit, `packages/lwc-plugin-*/src/` for
the plugins, `website/docs/plugins/*.md` for the docs, `plugin-examples/` for
the proof-of-concept examples.

```sh
# what version is installed, and does the hook I am about to rely on exist in it?
node -p "require('lightweight-charts/package.json').version"
rg -n "hitTest|conflationReducer|isHovered|ICustomSeriesPaneView|IPrimitivePaneRenderer" node_modules/lightweight-charts/dist/typings.d.ts
# the toolkit's custom-series surface
rg -n "export (declare )?(function|class|interface|type)" node_modules/@tradingview/lwc-toolkit/dist/custom-series/*.d.ts
# a reference implementation, without a checkout
curl -fsSL https://raw.githubusercontent.com/tradingview/lightweight-charts/master/packages/lwc-plugin-stacked-bars-series/src/renderer.ts
```

Local typings win over the docs when they disagree: the docs describe the
current release, the typings describe what the user actually has. If a file is
missing, say what could not be verified. Never invent an option, a hook or a
toolkit export — a plugin that compiles against an imagined API fails the
user's typecheck, and one that compiles against an option the chart ignores
fails silently at runtime.

## From idea to plugin type

The single most consequential decision, and the one to make first. Ask what
the idea *is* rather than how it looks:

| The idea is… | Type | Because |
| --- | --- | --- |
| a new way to draw a series' own data (bars, bands, stacks, candles) | **custom series** | it needs its own data, autoscale, price line, last value and time-scale integration |
| a decoration tied to one series (label, marker, band around it, drawing tool on its data) | **series primitive** | it reads that series' coordinates and is clipped to it |
| a decoration tied to the pane (watermark, legend, title, an overlay for every series) | **pane primitive** | it spans the pane and outlives any one series |
| a DOM-based accessibility, tooltip or control layer | **pane primitive** with a DOM overlay | the canvas is not the right medium; append to `paneContentElement(pane)` |

Default to a primitive. A custom series is the heavier construct — it must
implement `priceValueBuilder`, `isWhitespace`, `renderer` and `update`, and
its renderer is called with the series' plot data. Only choose it when the
idea *is* a series. A drawing tool that needs pointer handling is still a
primitive: it draws in a primitive and reacts through `subscribeClick`,
`subscribeCrosshairMove` and the coordinate-conversion APIs.

Keep hover and interaction in mind when choosing: primitives get a `hitTest`
so the chart can report them in crosshair and click events; custom series get
`hitTest`, `isHovered` and `hitTestData` on their renderer, but only on
Lightweight Charts™ 5.1 and later.

## Working method

Build in this order. Each step is the cheapest place to find the previous
step's mistakes.

1. **Write down the data item and the options** before any code. The data
   item decides `isWhitespace` (which fields make a point drawable) and the
   options decide `defaultOptions`. Both go in their own files
   (`data.ts`, `options.ts`) because the README, the types and the demo all
   read them.
2. **Scaffold** (below). Do not start from a blank file.
3. **Get the renderer drawing with the sample data** the scaffold generates,
   visible-range only, before touching options or interaction. A renderer that
   draws everything, or draws nothing, is easier to fix while it is small.
4. **Wire the options** through `applyOptions`; re-render with
   `requestUpdate()`. Check every option does something in the demo page.
5. **Custom series only: autoscale and whitespace.** `priceValueBuilder`
   drives the price scale and the last-value label; whitespace decides where
   the line breaks. Both have traps (checklist below).
6. **Interaction**: `hitTest`, hover, drag. Keep it separate from drawing.
7. **Tests**, then the README, then the demo and preview pages. The package
   contract (`references/package-contract.md`) says what each must contain.

## Scaffold, don't start blank

```sh
npm create lwc-plugin@latest
```

The wizard is interactive. It first offers to install this skill (say no if it
is already installed, or the user quit the wizard to hand over to you), then
asks for the type, a name, a one-sentence description, a package name, a class
name, author, licence, the minimum library version, tags, whether to keep hint
comments, and the target folder. Work those answers out with the user before
anyone runs it — the type decision above is the one that matters — then have
the user run the wizard in their terminal, unless your environment gives you a
TTY to answer the prompts yourself. It writes a Vite project with:

- `src/<entry>.ts` — the plugin class (and, for a custom series, a factory);
  `src/options.ts`, `src/data.ts`, and a renderer or view file per type
- `src/example/index.html` + `example.ts` — the dev demo, `pnpm dev` serves it
- `package.json` with `dev`, `build`, `typecheck` and `check-package` scripts,
  a `lightweight-charts` peer range, `@tradingview/lwc-toolkit` as a
  devDependency, and an `lwcPlugin` block for the catalogue
- a README already in the shape the catalogue renders

Answer yes to "hint comments": they are `//*` lines that explain each part of
the template and are stripped by the wizard otherwise. Read them, then delete
the ones you have acted on. Build against the scaffold's own scripts
(`pnpm typecheck`, `pnpm build`, `pnpm check-package`) — they are what CI and
the release tooling run.

## Build on the toolkit

`@tradingview/lwc-toolkit` is what the ten official plugins are built from,
extracted from the helpers every example used to copy by hand. Reaching for
it is not about saving lines; it is that the helpers encode chart behaviour
that is easy to get subtly wrong — the exact width the built-in candlestick
uses at a given bar spacing, pixel-perfect line positions at every device
pixel ratio, the dash patterns of `LineStyle`, how conflation changes a bar's
logical stride. Import each helper by sub-path:

```ts
import { CustomSeriesRendererBase } from '@tradingview/lwc-toolkit/custom-series/renderer-base';
import { visibleSegments, extendRange, barCoordinate } from '@tradingview/lwc-toolkit/custom-series/visible-bars';
import { PluginBase } from '@tradingview/lwc-toolkit/plugin-base';
```

Problem → module, for the common cases. `references/toolkit.md` has the rest,
with the shape of each API and the official plugin that uses it.

| You need to… | Use |
| --- | --- |
| write a custom series renderer without re-doing the data / range guards | `custom-series/renderer-base` — extend `CustomSeriesRendererBase`, implement `drawImpl(scope, args)` |
| a series or pane primitive with the chart reference and `requestUpdate()` handled | `plugin-base` (`PluginBase`) / `pane-plugin-base` (`PanePluginBase`) |
| draw only what is on screen, and reach the pane edge with a line | `custom-series/visible-bars` — `forEachVisibleBar`, `mapVisibleBars`, `extendRange`, `barCoordinate` |
| break a line at explicit whitespace, not at other series' timestamps | `createWhitespaceSeries` (`custom-series/options-aware-series`) + `visibleSegments` |
| read options inside `priceValueBuilder` (autoscale that follows options) | `createOptionsAwareSeries` with the option names that affect plot values |
| stacked values: band edges and autoscale extremes | `custom-series/stacking` — `stackLevels`, `stackedPlotValues` |
| columns, candles or lines the same width as the built-ins, pixel-aligned | `dimensions/*` — `calculateColumnPositions`, `candlestickWidth`, `positionsLine`, `positionsBox` |
| rounded rectangles with an inset border | `canvas/round-rect` |
| polylines, step lines, the area between two lines, a line whose colour changes | `custom-series/line-paths` |
| a label on the price or time axis | `axis-label-view` (`AxisLabelView`) |
| a DOM overlay inside the pane | `dom/pane-element` (`paneContentElement`) |
| a small event, or a `Time` as a timestamp or display string | `delegate`, `time` |

When the scaffold's template already imports a toolkit helper, keep it; the
template is the smallest correct plugin of its type.

## Read the reference implementations

The ten official packages are the canonical examples: maintained, tested,
published, and built exactly the way this skill describes. Read the one
nearest your idea *before* designing — most questions ("how do I get the
hovered item?", "how do I autoscale a stack?") are answered by a file in
one of them. Upstream they are `packages/lwc-plugin-*/src/`. From any other
repository the published `@tradingview/lwc-plugin-*` package gives you the
README and the `dist/*.d.ts`, but not the source — fetch that from GitHub
(raw URL or a shallow clone, see above); each plugin is a handful of files.

| Building… | Read |
| --- | --- |
| any custom series | `stacked-bars-series` (the simplest complete one), then `pretty-histogram-series` |
| a series with several values per point | `stacked-area-series`, `stacked-bars-series` |
| a line/area that must break at gaps, or survive conflation | `hlc-area-series`, `brushable-area-series` |
| a series with its own pointer interaction | `brushable-area-series` (`BrushableAreaInteraction`) |
| a replacement for a built-in series | `rounded-candles-series` (matches candlestick options and widths) |
| a fixed-pixel-height overlay series | `dual-range-histogram-series` (`scaleMode`, `keepPixelSeriesInView`) |
| a series primitive with an axis label and dragging | `vertical-line` |
| an image or decoration behind a series or pane | `image-watermark` (both a series and a pane primitive) |
| a DOM layer on a pane, multi-pane lifecycle | `accessibility` |

`references/official-plugins.md` says what each one demonstrates in detail.
`plugin-examples/src/plugins/` in the repository
(`https://github.com/tradingview/lightweight-charts/tree/master/plugin-examples`)
holds a further set of proof-of-concept plugins — tooltips, drawing tools,
session highlighting, heatmaps, … — good for breadth and ideas, but they are
unpublished starting points, not the standard to match. The ten graduated
plugins' folders there are redirects to the packages.

## Read the documentation in this order

Fetch pages as Markdown — append `.md` to the URL — rather than scraping the
HTML: `https://tradingview.github.io/lightweight-charts/docs/plugins/<page>.md`.
`https://tradingview.github.io/lightweight-charts/llms.txt` is the index of
every page, `docs_map.md` the same with headings, and
`lightweight-charts.d.ts` beside them the released typings.

1. `intro` — the three plugin types and how they attach.
2. `series-primitives` or `pane-primitives` — the view/renderer/lifecycle
   contract for your type: `attached` / `detached`, `updateAllViews`,
   `paneViews`, `priceAxisViews`, `timeAxisViews`, `hitTest`.
3. `custom_series` — `ICustomSeriesPaneView`: `priceValueBuilder`,
   `isWhitespace`, `renderer`, `update`, `defaultOptions`, and the 5.1 hooks.
4. `canvas-rendering-target` — the `CanvasRenderingTarget2D` you draw on and
   its two coordinate spaces.
5. `pixel-perfect-rendering` — why widths and positions go through the
   `dimensions/*` helpers.

For anything the pages do not cover, read the typings rather than the
generated API reference — they are complete, and the `.d.ts` is what your code
compiles against. The docs describe the current release; when your peer range
starts earlier, the typings of the installed version are what you actually
have.

## Correctness checklist

Each of these has bitten a shipped plugin. The reasons are here so they can
be recognised in a new shape, not just avoided in the old one.

### Drawing

- Draw in `useBitmapCoordinateSpace` for anything that must be crisp (lines,
  bars, borders) and scale widths by `horizontalPixelRatio` /
  `verticalPixelRatio`; use `useMediaCoordinateSpace` for text and layout in
  CSS pixels. Mixing them blurs on HiDPI. The `dimensions/*` helpers return
  bitmap positions for exactly this reason.
- `CanvasRenderingTarget2D` comes from `fancy-canvas`, not from the library;
  the toolkit re-exports the type from `custom-series/renderer-base` so a
  custom series need not depend on it.
- Restore anything you set on the context (`save`/`restore`, or reset
  `globalAlpha`, `lineCap`, dash). The next renderer draws on the same
  context.
- A `priceToCoordinate` that returns `null` means the price is off the
  scale. Skip that point or break the line there; drawing to `NaN` loses the
  whole path.

### Visible range and coordinates

- Draw `data.visibleRange` only; a series can have a million points. For
  lines and areas widen the range by one bar with `extendRange` so the first
  and last segments leave the pane instead of stopping at the edge.
- Bars outside the visible range may carry stale or missing `x`. Rebuild a
  coordinate from a visible anchor with `barCoordinate(bar, anchor,
  barSpacing)` — `bar.time` is the *logical index*, and spacing is per index.
- `bar.time` (logical index) and the array index `i` differ as soon as another
  series starts earlier or the data has gaps. Per-index option lookups and
  brush ranges use the logical index.

### Custom series specifics

- `priceValueBuilder` returns the plot values the chart autoscales on and
  takes the *last* as the current value (price line, last-value label). For
  a stack report `[min, max, total]` (`stackedPlotValues`); for a band the
  extremes; for a single value `[value]`.
- It runs at `setData`, before any render, so a plain view has no options
  yet — the chart has not called `update` — and `percent`, `base` or
  `scaleMode` are ignored on the first ingest. `createOptionsAwareSeries`
  gives the builder a live options getter and re-ingests when a named option
  changes; this is why the official series ship a `createXSeries` factory as
  the supported entry point and keep the class exported for composition.
- The host hands a custom renderer **no whitespace**: bars simply skip the
  gap, and a jump in logical index may just be another series' timestamps.
  Break lines only at the series' own whitespace, from its accepted input:
  `createWhitespaceSeries` provides a `GapCheck`; pass
  `getConflationFactor(data)` as its `minGap` so a whitespace run narrower
  than one conflation bucket is absorbed rather than splitting every bucket
  into a single-point segment.
- `hitTest`, `isHovered` / `hitTestData`, `conflationReducer` and
  `conflationFactor` exist from 5.1. Implement them as optional extras, keep
  the peer range at `^5.0.0` unless you need them, and say so in the README.
- `conflationReducer(a, b)` must return a data item of your own type that
  makes sense as the merge of two: sum for stacks, high/low/last for OHLC,
  the later value for a rate.

### Primitives specifics

- `requestUpdate()` after any change the chart cannot see (an option, a new
  time, a decoded image). The chart does not poll your state.
- `detached()` must undo everything `attached()` did: listeners, DOM nodes,
  timers, pending image loads. Attach/detach cycles are common (React
  effects, pane reordering) and leaks show up as ghost drawings and thrown
  "disposed" errors.
- A pane primitive is drawn only on the pane it is attached to; a pane index
  given to a constructor is a hint that can be wrong. Resolve the real pane
  lazily (the first draw's `context.canvas` is inside it) and hold it by
  identity — indices shift when panes are added, removed or moved.
- For DOM overlays, append to `paneContentElement(pane)` and keep the
  overlay's layout independent of the chart's own table cells.

## Testing

Three layers, each catching something the others cannot. The official
packages have all three under `tests/`; the scaffold sets up the first.

- **Unit** (`tests/unit/*.spec.ts`, `node:test` + `chai`): pure functions —
  stacking maths, option merging, data padding, gap detection. Fast, run by
  the repository's `pnpm test`.
- **Graphics** (`tests/graphics/*.js`): a page that draws one state; CI
  compares the screenshot against the previous build's. One case per option
  worth seeing, plus the edge cases: empty visible range, scrolled off, a
  whitespace run, conflation, inverted scale.
- **Interactions** (`tests/interactions/*.js`): a page with an async
  `beforeInteractions(container)` that drives the chart and throws on a
  wrong outcome — pixel sampling for "did it paint", DOM checks, hit tests.
  This is where whitespace, update, `pop` and pointer behaviour are tested.

Run upstream with `pnpm test`, `pnpm e2e:graphics:plugins` and
`GREP="lwc-plugin-<name>/" pnpm e2e:interactions`, after `pnpm build:prod`
and `pnpm --filter "@tradingview/lwc-plugin-*" build`.

## Publishing and the catalogue

A plugin is publishable when `pnpm plugins:validate` passes upstream, or the
equivalent by hand: an `lwc-plugin-*` name, `publishConfig.access: public`, a
`lightweight-charts` peer range, the `lightweight-charts-plugin` keyword, a
complete `lwcPlugin` block, a README with `## Installation` (`### npm` and
`### CDN` tabs) and `## Usage`, and the demo page it declares. The scaffold
meets all of it. The docs site's plugin catalogue renders the README and
frames a preview page built from the package; `references/package-contract.md`
has the fields, the pages and the first-release changelog convention (short:
an `Added` list, no `Fixed` — there is nothing to have fixed yet).

## Answer contract

When helping with a plugin:

1. Name the plugin type and say why in one sentence, or explain what the
   user's idea would lose in the other type.
2. Point at the toolkit module and the official plugin you are basing the
   answer on. Read the plugin's file before quoting its pattern.
3. Verify every library and toolkit name against the local typings; say what
   you could not verify.
4. Produce code that the scaffold's own scripts accept: `pnpm typecheck`,
   `pnpm build`, and `pnpm dev` showing it in the demo page.
5. When the change touches autoscale, whitespace, the visible range or
   hover, name the test that would have caught the regression and write it.
