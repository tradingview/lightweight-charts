# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-brushable-area-series`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `BrushableAreaSeries` custom series draws an area with a base style and
  any number of `brushRanges`, each with its own line and fill colors. A
  range's `style` is partial: properties left out fall back to the base style.
- The `outsideStyle` option styles the points outside every brush range, so a
  selection can be highlighted without swapping the series' base style.
- The `basePrice` option is the price the area is filled down to, clamped to
  the pane when it is off-screen. The area used to always reach the bottom of
  the pane.
- The host application owns the interaction: set `brushRanges` from your own
  pointer handling to build a brush selection.
