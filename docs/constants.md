# Constants

The `lightweight-charts` package exports some enums which you can use to set up your chart, series etc.

These enums are described here.

## LineType

`LineType` enum is used to specify the type of the line for series such as area or line.
It has the following values:

- `LineType.Simple`
- `LineType.WithSteps`

## LineStyle

`LineStyle` enum is used to specify the style of the line for series such as area or line.
It has the following values:

- `LineStyle.Solid`
- `LineStyle.Dotted`
- `LineStyle.Dashed`
- `LineStyle.LargeDashed`
- `LineStyle.SparseDotted`

## PriceScaleMode

`PriceScaleMode` enum is used to specify the price scale mode.

It has the following values:

- `PriceScaleMode.Normal` - normal mode.

    Price scale shows prices and price range is changing linearly.

- `PriceScaleMode.Logarithmic` - logarithmic mode.

    Price scale shows prices, but price range is changing logarithmically.

- `PriceScaleMode.Percentage` - percentage mode.

    Price scale shows percentage values according the first visible value of the price scale.
    The first visible value is `0%` in this mode.

- `PriceScaleMode.IndexedTo100`- indexed to 100 mode.

    The same as percentage mode, but the first value is moved to 100.

## CrosshairMode

`CrosshairMode` enum is used to specify crosshair mode.

It has the following values:

- `CrosshairMode.Magnet` - magnet mode of the crosshair.

    Crosshair horizontal line is anchored to bar close price.

- `CrosshairMode.Normal` - normal mode of the crosshair.

    Crosshair moves freely on the chart.
