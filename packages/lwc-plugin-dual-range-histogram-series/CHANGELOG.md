# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-dual-range-histogram-series`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `DualRangeHistogramSeries` custom series draws nested up and down
  columns of a fixed pixel height on the zero line.
- Styling options: `colors` and `borderRadius`, each keyed by column
  (`upOuter`, `upInner`, `downOuter`, `downInner`), and `maxHeight`.
