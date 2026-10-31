# Duplicate timestamps in a series

Status: implemented (opt-in per series).
Scope: `setData` / `update` accepting several data items with the same `time` in
one series, and what that does to the render pipeline.

---

## 1. The problem

The time scale's identity was **one row per (series, time)**
(`DataLayer._pointDataByTimePoint: Map<timeKey, TimePointData>` with
`TimePointData.mapping: Map<Series, row>`). Any support for duplicates means
adding a second identity dimension.

Before this change the `checkItemsAreOrdered` assert in development builds was the
only thing protecting users: in a production build duplicates were accepted and
silently corrupted the layout. Measured on the old code, with data
`1000, 2000, 3000, 3000(dup), 4000`:

```
rows:   idx 0, 1, 0(stale), 2, 3      <- non-monotonic plot list
points: 4 distinct times for 5 items
```

The later duplicate overwrote the earlier one in `mapping`, so the earlier one
kept its stale `index: 0` and rendered at the far-left slot. Every binary search
(`PlotList._bsearch`, `visibleTimedValues`, `minMaxOnRangeCached`, tick marks)
assumes the index sequence is sorted, so results were wrong rather than visibly
broken.

## 2. The model that shipped: slots

A time key now holds **an array of time points** ("slots"): slot `k` is the `k`-th
data item with that time. `TimePointIndex` is a slot index, so it stays unique and
strictly increasing for every data item. That single change keeps the entire
index-driven render pipeline valid:

```ts
_pointDataByTimePoint: Map<InternalHorzScaleItemKey, TimePointData[]>
```

Cross-series alignment rule: a series that has no data at a time joins slot 0, and
its `k`-th item at that time occupies slot `k`. Two series both having duplicates
at the same time therefore align occurrence-by-occurrence.

Nothing else in the render stack needed a model change: `PlotList`, conflation,
autoscale chunking, and all bar/line/area/histogram pane views map `row.index → x`
through `timeScale.indexesToCoordinates`.

## 3. API

```ts
const series = chart.addSeries(CandlestickSeries, {
	allowDuplicateTimes: true,
});

series.setData([
	{ time: 1700000000, open: 1.0, high: 1.1, low: 0.9, close: 1.05 }, // tick 1
	{ time: 1700000000, open: 1.05, high: 1.2, low: 1.0, close: 1.15 }, // tick 2, same second
	{ time: 1700000001, open: 1.15, high: 1.2, low: 1.1, close: 1.12 },
]);

// streaming: an update with the same time as the last bar appends a tick
series.update({ time: 1700000001, open: 1.12, high: 1.3, low: 1.1, close: 1.25 });
```

`allowDuplicateTimes` (default `false`, in `SeriesOptionsCommon`) controls:

| | `false` (default) | `true` |
|---|---|---|
| `setData` with repeated `time` | dev: throws; prod: corrupted (unchanged) | one slot per item, data order preserved |
| `update` with the last bar's `time` | replaces the last bar (unchanged) | appends a new occurrence |
| `update(whitespace)` at the last bar's time | removes the last bar | removes the last bar, allocates no slot |
| `historicalUpdate: true` | replaces the row at that time | replaces the **last** occurrence of that time |
| `pop()` | removes the last row | removes the last occurrence, frees its slot |
| `timeToIndex` / `timeToCoordinate` | one index per time | first (leftmost) slot |

Whitespace items never create an extra occurrence: they carry no value, so a
duplicate whitespace would only create a hole.

## 4. Rendering

**Geometry is unaffected by the duplicates themselves.** Bar spacing comes from
logical indexes (`indexToCoordinate` = `width - (baseIndex + rightOffset - index +
0.5) * barSpacing`), never from timestamp deltas. Two ticks one millisecond apart
occupy the same width as two ticks an hour apart — the same convention as the
library's existing session-gap-free index scale. Every duplicate is a full slot, so
candles never collapse to zero width.

**Time-axis labels are deduplicated.** All items sharing a time produce the same
formatted label, and duplicate slots get the weakest tick weight
(`TickMarkWeight.LessThanSecond`, because all `floor(t / divisor)` comparisons are
equal). `TimeScale.marks()` now skips a mark whose time equals the previously kept
label's time, so a tick cluster shows `12:00` once instead of `12:00 12:00 12:00`.

**Scroll and zoom limits shift slightly.** `_minBarSpacing`, `_minRightOffset` and
`_maxRightOffset` clamp against `_points.length`, which now counts slots. A
duplicate-heavy chart gets proportionally more scroll room to the left.

**Crosshair** reports the correct time and the correct per-series value for each
slot. `setCrosshairPosition(price, time)` lands on the first slot.

**Repaint cost is unchanged for streaming.** Appending a duplicate of the current
bar is the same code path as appending a bar: every plot list is replaced and the
autoscale chunk cache is cleared. Inserting a duplicate at an older time shifts
every later index and triggers a full reindex of all series, exactly like calling
`setData` today.

## 5. Known limits

1. **Time-addressed plugins resolve to the first occurrence.** Anything that
   locates by `time` rather than by index — `series-markers`, `vertical-line`,
   `accessibility`, `scatter-series`, `lwc-toolkit` custom series, and the public
   `ITimeScaleApi.timeToCoordinate` — always addresses slot 0 of a duplicated
   time. Slots beyond the first are reachable only by logical index.
2. **Sub-second axis labels** are a separate feature and are now implemented: see
   [nanosecond-timestamps.md](./nanosecond-timestamps.md). Duplicate handling
   itself is independent of the time resolution.
3. **Memory.** One small `Map` per slot instead of one per distinct time, i.e. a
   constant-factor increase proportional to the number of rows.
4. **Pre-existing, unrelated:** `pop()` removing the last remaining row returns
   `firstChangedPointIndex === -1` (no points in the update response) and
   `baseIndex === 0`, so the time scale is not cleared explicitly. Duplicates do
   not change this.

## 6. Files touched

| file | change |
|---|---|
| `src/model/data-layer.ts` | slot arrays; occurrence-aware `setSeriesData`, `updateSeriesData`, `popSeriesData`, `_cleanupPointsData`; `upperBound` insertion; `append` flag for `_updateLastSeriesRow` |
| `src/model/series-options.ts` | `allowDuplicateTimes` on `SeriesOptionsCommon` |
| `src/api/options/series-options-defaults.ts` | default `false` |
| `src/model/series.ts` | `Series.allowDuplicateTimes()` |
| `src/api/series-api.ts` | validator honours the option |
| `src/model/time-scale.ts` | label dedupe in `marks()` |
| `src/api/iseries-api.ts`, `src/api/itime-scale-api.ts` | contract docs |
| `tests/unittests/data-layer.spec.ts` | 10 duplicate cases (indices, alignment, append/replace, whitespace, slot release, pop, streaming run) |
| `tests/unittests/conflation-integration.spec.ts` | mock gained `allowDuplicateTimes` |

## 7. Verification

```sh
npx esno --import ./tests/unittests/setup.units.mjs --test './tests/unittests/**/*.spec.ts'
npx -p typescript@5.9.3 tsc -p tsconfig.json --noEmit
npm run tsc && npm run rollup            # needs a full install
npm run e2e:graphics:plugins             # needs the dev build + puppeteer
```

`tests/e2e/graphics/test-cases/data-validation.js` asserts that duplicates throw
in a development build — still true, because the option defaults to `false`.
