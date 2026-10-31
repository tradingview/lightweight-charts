# Nanosecond timestamps

Status: implemented.
Builds on [duplicate-timestamps.md](./duplicate-timestamps.md) (slot model, shipped).

A series can now be driven by QuestDB `TIMESTAMP_NS` data: nanosecond-exact ordering,
rendering and round-tripping, with sub-second labels on the axis and an exact value in
the crosshair tooltip.

---

## 1. Accepted time representations

| `time` value | resolution | key type |
|---|---|---|
| `UTCTimestamp` (number, seconds, optionally fractional) | ms-safe (fraction limited by the double: ~238 ns at epoch) | `number` |
| `UTCTimestampNanoseconds` (`bigint`, epoch ns) | exact ns | `bigint` |
| `'2024-05-01T12:00:00.123456789Z'` (ISO 8601, 1-9 fractional digits) | exact ns | `bigint` |
| `BusinessDay` / `'2024-05-01'` | day | `number` |

The ISO form is parsed **without `Date`** (regex + `Date.UTC` for the whole seconds,
the fraction read as a string and padded to 9 digits), so nothing is lost on the way in.
A designator is optional; `Z`, `±HH:MM` and `±HHMM` are understood, and a string with no
designator is treated as UTC.

Millisecond data can use any of the first three: fractional seconds are exact to ~238 ns
at epoch, and ISO strings with three digits are exact.

## 2. Why the key had to grow beyond `number`

`InternalHorzScaleItemKey` (the identity used by every map, sort and binary search) was
`Nominal<number>`, and a double is exact only up to `2^53`:

```text
2^53              9 007 199 254 740 991
epoch ns today    1.79e18   (61 bits)  -> not representable
epoch µs today    1.79e15   -> representable
Number(1700000000000000001n) === Number(1700000000000000002n)  // true!
```

So the key is now `Nominal<number | bigint>`: `number` wherever it is exact (seconds,
business days, fractional seconds) and `bigint` (epoch ns) wherever it is not. The two
kinds never mix inside one chart because the converter is chosen once per series from its
first item, and they only ever meet through relational comparison, which JS defines
exactly for `number` vs `bigint`.

Keys are computed once per time point and cached in a `WeakMap` on the behaviour
(`HorzScaleBehaviorTime._keys`), so the sort and binary-search paths do not allocate
bigints per comparison and `TimePoint` keeps its public shape.

## 3. What changed

| file | change |
|---|---|
| `horz-scale-behavior-time/types.ts` | `UTCTimestampNanoseconds`, `Time` union, `isUTCTimestampNanoseconds`, `isBusinessDay` excludes bigint, `TimePoint.nanos`, `TickMarkWeight.Nano/Micro/Milli`, `TickMarkType.TimeWithMilliseconds/Microseconds/Nanoseconds`, fraction helpers |
| `horz-scale-behavior-time/time-utils.ts` | bigint converter (negative-safe split), exact ISO date-time parser, converter selection, `preprocessData` no longer rewrites date-time strings to business days |
| `horz-scale-behavior-time/horz-scale-behavior-time.ts` | `key()` via cached bigint computation, `cacheKey()` = key (ms would collapse sub-ms labels), fraction-aware `weightToTickMarkType`, tooltip formatter gets `nanos`, `maxTickMarkCharacterLength()` |
| `horz-scale-behavior-time/time-scale-point-weight-generator.ts` | weights from `{seconds, nanos}`, sub-second classes (`Milli`/`Micro`/`Nano`), duplicates keep the weakest weight |
| `horz-scale-behavior-time/default-tick-mark-formatter.ts` | appends 3/6/9 fractional digits (Intl cannot go past 3) |
| `formatters/time-formatter.ts`, `date-time-formatter.ts` | `%f` (lossless auto precision) and `%S` (fixed 9) tokens; tooltip time format is now `%h:%m:%s%f` |
| `model/ihorz-scale-behavior.ts` | widened `InternalHorzScaleItemKey`/`cacheKey`, optional `maxTickMarkCharacterLength` |
| `model/time-scale.ts` | label width budget takes the behaviour's requirement into account |
| `model/data-layer.ts` | key comparison without subtraction (`compareKeys`) |
| `model/formatted-labels-cache.ts` | `number \| bigint` cache keys |
| `index.ts` | exports `isUTCTimestampNanoseconds` |
| `packages/lwc-toolkit/src/time.ts` | bigint and ISO branches in `convertTime`/`convertTimeUTC`/`displayTime` |

## 4. Rendering

**Geometry** is untouched: slot spacing comes from logical indexes, and nanosecond
timestamps are *unique* keys, so ns data actually produces **fewer** duplicate slots than
second-resolution tick data. Duplicates only happen when the same nanosecond repeats
(`allowDuplicateTimes`), which the slot model already handles.

**Axis labels** get sub-second precision from the weight classes:

```text
1 s    apart -> HH:MM:SS
1 ms   apart -> HH:MM:SS.123
1 µs   apart -> HH:MM:SS.123456
1 ns   apart -> HH:MM:SS.123456789
```

A label is only as precise as the tick mark it belongs to: a mixed dataset shows
`12:00:00` in the daily region and `12:00:00.123456789` in the tick cluster. Digits are
fixed per weight class (no per-value trimming) so labels stay columnar and the string is
cached per `(weight, time)`.

**Alignment is preserved, density adapts.** Labels are always centred on their tick
coordinate; nothing re-lays them out. What changes is the *width budget* fed to the label
density heuristic (`indexPerLabel`): `maxTickMarkCharacterLength()` reports
`hh:mm:ss.` + digits (12/15/18 characters) and `TimeScale.marks()` uses
`max(option, reported)` for both density and the edge-alignment threshold. The result is
fewer labels, not overlapping ones — a nanosecond axis at default spacing simply labels
every 18th bar instead of every 8th. If you set `timeScale.tickMarkMaxCharacterLength`
explicitly, that value still wins, so you can force shorter labels if you need a higher
density.

**Crosshair/tooltip** shows the exact value: `.123`, `.123456` or `.123456789` depending
on what the value needs (`%f` trims only trailing zeros, i.e. never loses information),
and `%S` gives a fixed 9 digits if you prefer. `timeFormatter` still receives the
`originalTime`, so it round-trips what you passed in.

**Label cache** is keyed by the time key (bigint for ns), so two ticks inside one
millisecond no longer share a cached label string.

## 5. Round-trip and public surface

`coordinateToTime`, `MouseEventParams.time`, `getVisibleRange()`, `series.data()`,
`dataByIndex()` and `barsInLogicalRange()` all return `originalTime` — exactly the value
you supplied (bigint or the ISO string), including its nanoseconds. `bigint` does not
survive `JSON.stringify`; ISO strings do, which matters if your API response is what you
hand to `setData`.

Breakage to be aware of:

* `IHorzScaleBehavior.key()` / `cacheKey()` are public extension points. Custom horizontal
  scale behaviours keep compiling (`number` is assignable to `number | bigint`), but a
  custom behavior that *subtracts* keys must switch to relational comparison.
* Custom `tickMarkFormatter` callbacks can now receive
  `TickMarkType.TimeWithMilliseconds` / `WithMicroseconds` / `WithNanoseconds`. Return
  `null` to fall back to the default formatter.
* A chart must not mix time kinds (nanoseconds with seconds). Already true before this
  change; the values are now checked by kind.

## 6. Tests

`tests/unittests/nanosecond-time.spec.ts` (31 cases):

* guards, converter selection, exact bigint split (including pre-epoch values)
* ISO parsing: 9 digits, 3 digits, 1 digit, offsets, no designator, malformed input
* `preprocessData` leaves date-time strings alone
* keys: adjacent-ns distinctness and order, key == epoch ns, numeric keys for seconds,
  per-point caching, `cacheKey == key`
* weights: 1 ns / 1 µs / 1 ms / 1 s / 1 min / 1 day, duplicates get the weakest weight
* formatting: 3/6/9 digits, truncation (not rounding), lossless digit choice, `%f`, `%S`
* label width budget per visible range, and with `timeVisible: false`
* data layer: 1 ns apart = two times, identical ns = duplicates (one time, two slots),
  streaming appends at the same nanosecond

## 7. Verification

```sh
npx esno --import ./tests/unittests/setup.units.mjs --test './tests/unittests/**/*.spec.ts'
npx -p typescript@5.9.3 tsc -p tsconfig.json --noEmit
npm run tsc && npm run rollup            # needs a full install
npm run e2e:graphics:plugins             # goldens, needs the dev build + puppeteer
```

Golden-image coverage for the sub-second axis still has to be added (the graphics runner
needs Puppeteer, which is not installed in this checkout).
