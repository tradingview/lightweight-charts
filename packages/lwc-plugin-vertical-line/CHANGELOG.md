# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- The `VerticalLine` series primitive draws a full-height vertical line at a
  given time, with an optional label on the time axis. It is created with
  `new VerticalLine(time, options)` and takes the chart and the series from the
  series it is attached to.
- Options `color`, `width`, `lineStyle`, `lineVisible`, `showLabel`,
  `tickVisible`, `labelText`, `labelFormatter`, `labelBackgroundColor`,
  `labelTextColor`, `zOrder`, `snap`, `draggable`, `hitTestTolerance`, `id` and
  `badge`, typed as `VerticalLineOptions`. The defaults are exported as
  `defaultOptions`.
- `applyOptions` and `setTime` change a line after it has been created;
  `timeChanged()` reports every new time, including while the line is dragged.
- `snap: 'nearest'` places a line whose time is not a bar of the chart on the
  closest bar; with the default `'exact'` such a line is not drawn.
- `labelFormatter` builds the time-axis label from the line's time. With neither
  `labelText` nor `labelFormatter` the label uses the chart's own time format.
- An optional text `badge` draws a short caption on the line itself, kept inside
  the pane. Its defaults are exported as `defaultBadgeOptions`.
- `draggable: true` lets the user drag the line along the time scale, with an
  `ew-resize` cursor. Only one line per chart owns a drag, so overlapping
  draggable lines cannot fight over the chart's controls. `hitTest` reports the
  line's `id` as `externalId` for a pointer over it.

### Deprecated

- `VertLine` and `VertLineOptions`, the names used in the `plugin-examples`
  collection, are exported as aliases of `VerticalLine` and
  `VerticalLineOptions`. The four-argument constructor,
  `new VertLine(chart, series, time, options)`, also still works and ignores its
  chart and series arguments.
