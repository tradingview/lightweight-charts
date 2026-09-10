# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-image-watermark`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `ImageWatermark` series primitive draws an image behind the attached
  series, placed within the pane and scaled to fit.
- `ImageWatermarkPane`, the same watermark as a pane primitive, for a chart
  whose series come and go. Both classes share their options and methods.
- Options: `imageUrl`, `position`, `objectFit`, `maxWidth`, `maxHeight`,
  `padding`, `alpha`, `visible`, `zOrder`, `crossOrigin` and `onError`, typed
  as `ImageWatermarkPluginOptions`. The argument is optional, and the defaults
  are exported as `defaultOptions`.
- `applyOptions`, `setImage` and `options`: the watermark can be repositioned,
  hidden or given a new image while it is attached.
- Decoded images are cached by URL, so re-attaching a watermark, or using the
  same image twice, never loads it again.

### Deprecated

- `ImageWatermarkOptions`, the name used in the `plugin-examples` collection,
  is exported as an alias of `ImageWatermarkPluginOptions`. The option type was
  renamed because Lightweight Charts™ exports an `ImageWatermarkOptions` of its
  own, for the built-in `createImageWatermark`.

### Fixed

- Nothing is drawn until the image has been decoded. Previously the image
  element was used from the moment the load started, so every frame drew with
  `NaN` geometry, and an image which failed to load — a 404, a CORS refusal, a
  malformed SVG — made the renderer throw an `InvalidStateError` on every
  paint. A broken image now simply draws nothing, and reports through
  `onError`.
- The watermark is placed from the size of the pane it is drawn in, instead of
  from the chart element and the width of the left price scale. It is no longer
  offset when a left price scale is visible, and no longer sized from the
  height of every pane at once when the chart has more than one.
- `globalAlpha` is restored after drawing, instead of being left set on the
  canvas context.
- Detaching the watermark now releases the chart and cancels a pending image
  load, so repeated attach/detach cycles leak nothing and a load finishing
  after detach no longer touches a disposed chart. A watermark that has
  already loaded its image reuses it when re-attached, instead of refetching.
