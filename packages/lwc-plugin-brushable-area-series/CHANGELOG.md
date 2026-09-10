# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0

First release as a standalone package, graduated from the `plugin-examples`
collection of the Lightweight Charts™ repository.

### Added

- The `BrushableAreaSeries` custom series draws an area with a base style and
  any number of `brushRanges`, each with its own line and fill colors. A range's
  `style` is partial: properties left out fall back to the base style.
- `createBrushableAreaSeries`, the supported way to add the series. It retains
  the whitespace passed through `setData`, `update` and historical corrections,
  so a gap breaks the line and the fill while timestamps contributed by other
  series do not. The `BrushableAreaSeries` pane view stays exported for
  `chart.addCustomSeries` and for composing the renderer into another series, but
  draws continuously on its own: gaps need the factory.
- `outsideStyle`, which styles the points outside every brush range, so a
  selection can be highlighted without swapping the series' base style.
- `basePrice`, the price the area is filled down to, clamped to the pane when it
  is off-screen.
- The `BrushableAreaInteraction` series primitive turns a mouse drag, a
  one-finger drag or a two-finger gesture into a brush range: it sets the series'
  `brushRanges` and reports the selection through `activeRange()`, as logical
  indices and as the times of the data points at each end. Set `brushRanges` from
  your own pointer handling instead if you prefer to own the interaction.
- Options `lineStyle` (per style, so a brush range can be dashed differently from
  the rest), `lineVisible`, `lineType` (straight, stepped or curved, with the fill
  following the same shape), `relativeGradient` and `invertFilledArea`, matching
  the built-in `AreaSeries` where they share a name.
