# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.1.1 - 2026-10-31

### Fixed

- The upstream `lightweight-charts` peer dependency is marked optional again
  (`peerDependenciesMeta`). Without it, npm treats it as required and installs
  the upstream 5.x library next to the fork's, which the package does not use.

## 1.1.0 - 2026-10-31

### Changed

- The package is published under the `@bishopbot` scope instead of
  `@tradingview`, and its metadata points at
  `https://github.com/bishop-bot/lightweight-charts`.
- The library peer dependency is `@bishopbot/lightweight-charts` (`^6.0.0`).
  The upstream `lightweight-charts` stays an optional peer dependency, so a
  project that already depends on the upstream 5.x line does not have to
  change it.
- The sources import the library and the toolkit under their new names.

## 1.0.0 - 2026-09-16

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- `ImageWatermark`, a series primitive that draws an image behind the attached
  series, placed within the pane and scaled to fit.
- `ImageWatermarkPane`, the same watermark as a pane primitive, for a chart
  whose series come and go. Both classes share their options and methods.
- Options `imageUrl`, `position`, `objectFit`, `maxWidth`, `maxHeight`,
  `padding`, `alpha`, `visible`, `zOrder`, `crossOrigin` and `onError`, typed as
  `ImageWatermarkPluginOptions`. The argument is optional, and the defaults are
  exported as `defaultOptions`.
- `applyOptions`, `setImage` and `options`, so the watermark can be
  repositioned, hidden or given a new image while it is attached.
- Decoded images are cached by URL, so re-attaching a watermark, or using the
  same image twice, never loads it again.

### Deprecated

- `ImageWatermarkOptions`, the name used in the `plugin-examples` collection,
  is exported as an alias of `ImageWatermarkPluginOptions`. The option type was
  renamed because Lightweight Charts™ exports an `ImageWatermarkOptions` of its
  own, for the built-in `createImageWatermark`.
