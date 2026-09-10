# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

### Added

- First release as a standalone package, `@tradingview/lwc-plugin-vertical-line`.
  Graduated from the `plugin-examples` collection of the Lightweight Charts™
  repository.
- The `VerticalLine` series primitive draws a full-height vertical line at a
  given time, with an optional label on the time axis. It is created with
  `new VerticalLine(time, options)` and takes the chart and the series from
  the series it is attached to.
- Options: `color`, `width`, `lineStyle`, `lineVisible`, `showLabel`,
  `tickVisible`, `labelText`, `labelFormatter`, `labelBackgroundColor`,
  `labelTextColor`, `zOrder`, `snap`, `draggable`, `hitTestTolerance`, `id` and
  `badge`, typed as `VerticalLineOptions`. The defaults are exported as
  `defaultOptions`.
- `applyOptions` and `setTime` change a line after it has been created;
  `timeChanged()` reports every new time, including while the line is dragged.
- `snap: 'nearest'` places a line whose time is not a bar of the chart on the
  closest bar, instead of not drawing it at all.
- `labelFormatter` builds the time-axis label from the line's time. With no
  `labelText` and no `labelFormatter`, the label now uses the chart's own time
  format rather than being empty.
- An optional text `badge` draws a short caption on the line itself, kept inside
  the pane. Its defaults are exported as `defaultBadgeOptions`.
- `draggable: true` lets the user drag the line along the time scale, with an
  `ew-resize` cursor, and `hitTest` reports the line's `id` as `externalId` for
  a pointer over it.

### Fixed

- A line whose time cannot be placed on the time scale no longer leaves a stray
  time-axis label at the left edge of the axis: the label is hidden with the
  line.
- The line honours `lineStyle` instead of always being drawn solid, and its
  position is computed once per frame and shared by the pane view and the
  time-axis label rather than being resolved twice and reallocating a renderer
  on every paint.

### Deprecated

- `VertLine` and `VertLineOptions`, the names used in the `plugin-examples`
  collection, are exported as aliases of `VerticalLine` and
  `VerticalLineOptions`. The four-argument constructor,
  `new VertLine(chart, series, time, options)`, also still works and ignores
  its chart and series arguments.
