# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- `SessionHighlighting`, a series primitive that shades the background behind
  each bar of the attached series with the color a highlighter function
  returns for the bar's time. It is created with
  `new SessionHighlighting(highlighter, options)`, as in the `plugin-examples`
  collection, and an empty string from the highlighter leaves a bar unshaded.
- Options `visible` and `zOrder`, typed as `SessionHighlightingOptions`. The
  argument is optional, and the defaults are exported as `defaultOptions`.
- `applyOptions`, `setHighlighter` and `options`, so the shading can be
  changed, hidden or given a new highlighter while it is attached.
- Columns as wide as the time scale's bar spacing, so neighbouring bars abut
  exactly at every zoom level and pixel ratio, with or without gaps in the
  data.
- Only the bars on screen are drawn, and an incremental `series.update()` asks
  the highlighter for the bar it touched rather than for every bar.
