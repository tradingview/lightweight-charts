# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- `AnchoredText`, a series primitive that draws one line of text anchored to
  an edge, a corner or the centre of the pane the attached series is drawn in.
- `AnchoredTextPane`, the same text as a pane primitive, for a chart whose
  series come and go. Both classes share their options and methods.
- Options `text`, `horzAlign`, `vertAlign`, `horzMargin`, `vertMargin`, `font`,
  `lineHeight`, `color`, `visible` and `zOrder`, typed as `AnchoredTextOptions`.
  The argument is optional, and the defaults are exported as `defaultOptions`.
- `applyOptions`, `setText` and `options`, so the text can be changed, moved
  or hidden while it is attached.

### Deprecated

- `'middle'` as a value of `horzAlign` and `vertAlign`, the spelling used in
  the `plugin-examples` collection. It is still accepted and read as
  `'center'`, the spelling Lightweight Charts™ uses for its own text watermark.
