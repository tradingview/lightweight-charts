# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This package is the `bishop-bot` fork of
[TradingView's Lightweight Charts](https://github.com/tradingview/lightweight-charts).
It is published under the `@bishopbot` npm scope; the upstream package keeps the
unscoped `lightweight-charts` name and the `@tradingview` scope.

## 6.0.0 - 2026-10-31

First release of the fork. The package is published as
`@bishopbot/lightweight-charts` instead of `lightweight-charts`, and the
plugins and the toolkit move to the `@bishopbot` scope with it.

### Breaking

- The package is now published as `@bishopbot/lightweight-charts`. Install it
  with `npm install @bishopbot/lightweight-charts` and import it as
  `import { createChart } from '@bishopbot/lightweight-charts';`. The
  unscoped `lightweight-charts` name is owned by TradingView and is used by
  the upstream package, whose `5.x` line continues to be maintained there.
- The plugin packages are published as `@bishopbot/lwc-plugin-*` and the
  shared toolkit as `@bishopbot/lwc-toolkit`. They declare
  `@bishopbot/lightweight-charts` as their library peer dependency.

### Added

- Duplicate time support: a series may hold several items with the same time.
  Each item keeps its own column, and the axis renders one tick label per
  timestamp instead of repeating it.
- Nanosecond timestamps: `Time` accepts nanosecond values, ISO date-times with
  a sub-second part keep their precision, and the time axis labels show the
  fraction when it is not zero.

### Changed

- The package metadata points at `https://github.com/bishop-bot/lightweight-charts`
  for the repository, the issue tracker and the homepage.
- `NOTICE` keeps the upstream copyright notice and adds the fork's own.
