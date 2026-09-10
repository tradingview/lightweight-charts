# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-rounded-candles-series`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `RoundedCandleSeries` custom series draws candlesticks with rounded
  bodies. The corner `radius` is either a constant or a function of the bar
  spacing; it defaults to a function that adapts to the bar spacing.
- The whole set of built-in candlestick colour options is implemented:
  `upColor`, `downColor`, `borderVisible`, `borderColor`, `borderUpColor`,
  `borderDownColor`, `wickVisible`, `wickColor`, `wickUpColor` and
  `wickDownColor`, with the built-in series' shorthand semantics and the
  per-point `color` / `borderColor` / `wickColor` overrides.
- `wickLineCap: 'butt' | 'round'` chooses the shape of the two wick ends.
- `upDownMode: 'openClose' | 'previousClose'` chooses how a candle is decided to
  be rising or falling. The default, `openClose`, matches the built-in series.
- `hoverDimOpacity` dims the candles other than the hovered one, using the
  `hitTest` / `isHovered` support of Lightweight Charts™ 5.1 and later.
- `conflationReducer` merges conflated candles open-first, close-last, with the
  extremes of both.
- The data type is `RoundedCandleData`. `RoundedCandleSeriesData` remains as a
  deprecated alias.

### Fixed

- Keep both wick segments visible on inverted price scales.

- Candles are coloured on `open <= close`, like the built-in candlestick
  series, instead of comparing the close with the previous candle's close
  (which also made the first candle always rising). The old behaviour is
  available as `upDownMode: 'previousClose'`.
- Per-point `color`, `borderColor` and `wickColor` on a data item are honoured
  instead of being ignored.
- Body and wick are aligned on the same pixel grid at every device pixel ratio:
  the body width is computed in bitmap units, as the built-in series does,
  rather than in CSS pixels and rescaled afterwards.
- `conflationFactor` widens the candles while the chart conflates data, instead
  of leaving them at the unconflated width.
- The corner radius is scaled by the device pixel ratio, so candles are as
  round on a retina display as elsewhere, and clamped to the body it is drawn
  on.
- The wick is drawn above and below the body rather than as one bar behind it,
  so it no longer shows through a translucent body.
- The series no longer throws when the whole dataset is scrolled out of view
  and the visible range is empty.
