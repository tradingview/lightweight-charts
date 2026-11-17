# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 - 2026-11-13

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- The `GroupedBarsSeries` custom series draws the `values` array of each point
  as columns side by side, growing up from the base for values above it and
  down for values below it.
- `createGroupedBarsSeries`, the supported way to add the series. It reads the
  current options as the plot values are built, so `base` is part of the
  autoscale range from the first `setData`, and changing it rescales the series
  without setting the data again.
- Options `colors`, `base`, `columnWidthMode` and `widthPercent`, with the
  defaults exported as `defaultOptions`, and per-point `colors` overriding the
  series colors for that point's columns.
- Groups split into as many columns as the longest point has values, so a
  column is as wide in every group. In `percent` mode groups are all the same
  whole number of device pixels wide, and in every mode their columns abut
  with no seam and no overlap; when a group is too narrow for a pixel per
  column, every column still gets one.
- `null`, non-finite numbers and values equal to `base` leaving a column
  empty, and out of the autoscale range.
- `hitTest` reporting the hovered column, used by Lightweight Charts™ 5.2 and
  later. The package still runs on 5.0.0.
