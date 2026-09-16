# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

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
