# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-image-watermark`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `ImageWatermark` series primitive draws an image centered behind the
  attached series and scaled to fit.
- Options: `maxWidth`, `maxHeight`, `padding`, and `alpha`.

### Fixed

- Detaching the watermark now releases the chart and cancels a pending image
  load, so repeated attach/detach cycles leak nothing and a load finishing
  after detach no longer touches a disposed chart. A watermark that has
  already loaded its image reuses it when re-attached, instead of refetching.
