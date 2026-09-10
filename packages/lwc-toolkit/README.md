# @tradingview/lwc-toolkit

Helpers for authoring [Lightweight Charts™](https://www.tradingview.com/lightweight-charts/)
plugins — the pixel-arithmetic, subscription and base-class pieces that every
plugin ends up needing, so they do not have to be copied into each project.

Requires `lightweight-charts` 5.0 or later as a peer dependency.

```shell
npm install --save-dev @tradingview/lwc-toolkit
```

A dev dependency is usually the right choice: a plugin bundles the handful of
helpers it uses into its own output, so the people installing that plugin never
need this package themselves. See [Bundling](#bundling) below.

## Usage

Every helper is imported from its own sub-path. There is no barrel entry point,
so `@tradingview/lwc-toolkit` on its own does not resolve — import the module
you want:

```js
import { PluginBase } from '@tradingview/lwc-toolkit/plugin-base';
import { positionsBox, positionsLine } from '@tradingview/lwc-toolkit/dimensions/positions';
```

Sub-path exports need a modern module resolver. Set `moduleResolution` to
`"bundler"`, `"node16"` or `"nodenext"` in `tsconfig.json`; the legacy `"node"`
setting ignores the `exports` field and will report the imports as unresolved.

## Modules

| Sub-path | Provides |
| --- | --- |
| `assertions` | `ensureDefined`, `ensureNotNull` — narrow a value or throw |
| `axis-label-view` | `AxisLabelView`, `AxisLabelSource` — a price- or time-axis label over a source that may have no coordinate yet |
| `canvas/round-rect` | `drawRoundRect`, `drawRoundRectWithBorder`, `clampCornerRadius`, `CornerRadii` — rounded rectangles with an inset border |
| `closest-index` | `ClosestTimeIndexFinder` — cached binary search for the first index at or after (or last at or before) a time |
| `custom-series/line-paths` | `buildLinePath`, `buildStepLinePath`, `areaBetween`, `strokeStyledPolyline` — polylines (straight or stepped), the band between two lines, and a line whose style changes along its length |
| `custom-series/options-aware-series` | `createOptionsAwareSeries`, `createWhitespaceSeries`, `OptionsAwareSeries` — retain accepted input, bind price-value builders to current options and refresh stored values when scaling options change |
| `custom-series/renderer-base` | `CustomSeriesRendererBase`, `CustomSeriesDrawArgs` — a custom series renderer with the data and visible-range guards done, leaving `drawImpl` |
| `custom-series/stacking` | `cumulativeSum`, `stackLevels`, `stackedPlotValues` — running totals, the band boundaries of a stack drawn from a base, and the autoscale values of a stack that may contain negatives |
| `custom-series/visible-bars` | `forEachVisibleBar`, `mapVisibleBars`, `extendRange`, `visibleSegments`, `whitespaceGapCheck`, `barCoordinate`, `getConflationFactor` — iterate the visible bars only, reach the pane edge, split at whitespace gaps |
| `delegate` | `Delegate`, `ISubscription` — a small subscribe/fire event primitive |
| `dimensions/candles` | `candlestickWidth` — the body width the chart itself would use at a given bar spacing |
| `dimensions/columns` | `calculateColumnPositions`, `calculateColumnPositionsInPlace` — evenly spaced column bars with consistent gaps |
| `dimensions/common` | `BitmapPositionLength` — the `{ position, length }` pair the other dimension helpers return |
| `dimensions/crosshair-width` | `gridAndCrosshairMediaWidth`, `gridAndCrosshairBitmapWidth` — line widths matching the grid and crosshair |
| `dimensions/full-width` | `fullBarWidth` — a bar spanning the whole slot, with no gap |
| `dimensions/positions` | `positionsBox`, `positionsLine` — pixel-perfect boxes and lines from two coordinates |
| `dom/media-query` | `subscribeMediaQuery`, `mediaQueryMatches`, `HIGH_CONTRAST_QUERIES`, `REDUCED_MOTION_QUERY` — shared, SSR-safe media query subscriptions |
| `dom/pane-element` | `paneContentElement`, `chartTableElement` — the pane's canvas wrapper to append DOM overlays to, and the chart table |
| `line-style` | `setLineStyle`, `getDashPattern`, `LineStyle` — the chart's dash patterns for renderers that receive no drawing utils |
| `min-max-in-range` | `UpperLowerInRange` — cached upper/lower bounds over a range, for autoscaling |
| `pane-plugin-base` | `PanePluginBase` — the pane-primitive counterpart of `PluginBase`: chart reference and `requestUpdate` hook |
| `plugin-base` | `PluginBase` — a series-primitive base class holding the chart and series references and a `requestUpdate` hook |
| `simple-clone` | `cloneReadonly` — deep clone that drops readonly-ness |
| `time` | `convertTime`, `convertTimeUTC`, `displayTime`, `formattedDateAndTime` — `Time` to local or UTC timestamps and display strings |

The dimension helpers exist because canvas drawing has to land on whole device
pixels to look sharp at every device pixel ratio. See
[Pixel Perfect Rendering](https://tradingview.github.io/lightweight-charts/docs/plugins/pixel-perfect-rendering)
for the reasoning.

## Bundling

The package is ESM only, ships no side effects (`"sideEffects": false`) and
keeps one module per file, so a bundler drops whatever a plugin does not
reference. Since each plugin inlines only the helpers it actually uses — a few
hundred bytes, typically — the usual arrangement is to keep this as a
`devDependency` and let it disappear into the plugin's own bundle, rather than
making every consumer of the plugin install it.

`lightweight-charts` is a peer dependency and must stay external: the chart and
series objects are compared by identity, so a second copy of the library is a
bug rather than an inefficiency.

## Contributing

The sources live in the
[Lightweight Charts™ repository](https://github.com/tradingview/lightweight-charts/tree/master/packages/lwc-toolkit).

```shell
pnpm --filter @tradingview/lwc-toolkit build
```

On a fresh checkout, build the library first (`pnpm build:prod` in the
repository root) — this package compiles against the `lightweight-charts`
typings from the root `dist/`.

Consumers inside the repository use the compiled `dist/` output, so re-run the
build after editing a helper. The `plugin-examples` scripts do this
automatically before building.

## License

Apache-2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
