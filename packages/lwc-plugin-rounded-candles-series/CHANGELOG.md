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
- Color options: `upColor`, `downColor`, `wickUpColor`, and `wickDownColor`.
  The remaining built-in candlestick options (`borderVisible`, `borderColor`,
  `borderUpColor`, `borderDownColor`, `wickVisible`, `wickColor`) are accepted
  but not drawn yet.
- The data type is `RoundedCandleData`. `RoundedCandleSeriesData` remains as a
  deprecated alias.
