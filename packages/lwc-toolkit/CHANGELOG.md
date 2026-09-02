# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- Initial release. Helpers extracted from the Lightweight Charts™ plugin
  examples, where they were previously copied into each plugin by hand:
  - `assertions` — `ensureDefined`, `ensureNotNull`
  - `closest-index` — `ClosestTimeIndexFinder`
  - `delegate` — `Delegate`, `ISubscription`
  - `dimensions/candles` — `candlestickWidth`
  - `dimensions/columns` — `calculateColumnPositions`,
    `calculateColumnPositionsInPlace`
  - `dimensions/common` — `BitmapPositionLength`
  - `dimensions/crosshair-width` — `gridAndCrosshairBitmapWidth`,
    `gridAndCrosshairMediaWidth`
  - `dimensions/full-width` — `fullBarWidth`
  - `dimensions/positions` — `positionsBox`, `positionsLine`
  - `min-max-in-range` — `UpperLowerInRange`
  - `plugin-base` — `PluginBase`
  - `simple-clone` — `cloneReadonly`
  - `time` — `convertTime`, `displayTime`, `formattedDateAndTime`
