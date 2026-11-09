# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.1

### Changed

- The hit test result and conflation context types, which this package
  declared itself to keep supporting Lightweight Charts™ 5.0, come from
  `@tradingview/lwc-toolkit` 1.1.0 (`custom-series/compat`) instead.
  `RoundedCandleConflationContext` stays, as an alias of the toolkit's
  `ConflationContext`, which has the same shape.
- The bar spacing of conflated candles comes from the toolkit's
  `effectiveBarSpacing` instead of a copy in this package.
- The hit test is the toolkit's `nearestVerticalRange`, which finds the
  candles near the pointer by binary search instead of measuring every one on
  screen. It reports the same candle as before.
- The README states that hit testing needs Lightweight Charts™ 5.2; it said
  5.1, which has no hit testing for custom series.

## 1.0.0 - 2026-09-16

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- The `RoundedCandleSeries` custom series draws candlesticks with rounded bodies.
  The corner `radius` is either a constant or a function of the bar spacing, and
  defaults to a function that adapts to it.
- The whole set of built-in candlestick color options: `upColor`, `downColor`,
  `borderVisible`, `borderColor`, `borderUpColor`, `borderDownColor`,
  `wickVisible`, `wickColor`, `wickUpColor` and `wickDownColor`, with the built-in
  series' shorthand semantics and the per-point `color` / `borderColor` /
  `wickColor` overrides.
- `wickLineCap: 'butt' | 'round'` chooses the shape of the two wick ends.
- `upDownMode: 'openClose' | 'previousClose'` chooses how a candle is decided to
  be rising or falling. The default, `openClose`, matches the built-in series.
- `hoverDimOpacity` dims the candles other than the hovered one, using the
  `hitTest` / `isHovered` support of Lightweight Charts™ 5.1 and later;
  `conflationReducer` merges conflated candles open-first, close-last, with the
  extremes of both.

### Deprecated

- `RoundedCandleSeriesData` is exported as an alias of the data type's new name,
  `RoundedCandleData`.
