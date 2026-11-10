# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository. The options `color` and
`limitToOne` are renamed `lineColor` and `maxLines`.

### Added

- The `UserPriceLines` series primitive: a button at the right edge of the
  pane that follows the pointer and adds a price line to the series where it
  is clicked. Attach it with `series.attachPrimitive`.
- `addLine`, `removeLine`, `removeAll` and `lines()`, and the `lineAdded` and
  `lineRemoved` events. Detaching the plugin removes the lines it added.
- Options `lineColor`, `lineWidth`, `lineStyle`, `axisLabelVisible`,
  `buttonColor`, `hoverColor`, `maxLines` and `setCrosshairMode`, with the
  defaults exported as `defaultOptions`, and `applyOptions` and `options()`.
- The crosshair set to `Normal` mode while the plugin is attached, unless
  `setCrosshairMode` is off, and the previous mode put back when it is
  detached if the mode is still `Normal`.
- The button only in the series' own pane, only for the pointer (not for a
  crosshair placed with `setCrosshairPosition`), and only for the instance
  attached last in a pane; no line added by a tap away from the button or by
  a drag; the button shown
  at a price of 0; the button placed by the pane's width, also with the time
  axis hidden; a repaint asked for only when the button changes.
- The plugin lets go of the chart once its series is removed, and `remove()`
  does nothing after `chart.remove()`.
- The button reported to the chart's hit test as `ADD_BUTTON_ID`, with a
  pointer cursor.

### Deprecated

- `new UserPriceLines(chart, series, options)` and `remove()`, the
  `plugin-examples` form, which attaches the plugin itself. Pass the options
  only and use `series.attachPrimitive` and `series.detachPrimitive`.
