# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- The `BackgroundShadeSeries` custom series shades the full height of the pane
  behind each bar with a color mixed from `lowColor` and `highColor` by where
  its value sits between `lowValue` and `highValue`. Values outside the range
  get the end color.
- `createBackgroundShadeSeries`, which adds the series behind every other
  series in its pane.
- Options `lowColor`, `highColor`, `lowValue`, `highValue` and `opacity`, with
  the defaults exported as `defaultOptions`. The colors can be hex, `rgb()`,
  `rgba()`, `hsl()` or named colors, alpha included, and are mixed with
  premultiplied alpha.
- A point without a finite `value`, `null` included, read as whitespace.
- Shades taken from 256 steps between the two end colors, worked out when the
  colors change rather than for every bar on every frame.
- The series sits on a price scale of its own, takes no part in any other and
  is never reported as hovered, and a `conflationReducer` keeps the later of
  two points on Lightweight Charts™ 5.1 and later. The package still runs on
  5.0.0.
