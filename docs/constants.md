# Constants

The `lightweight-charts` package exports some enums which you can use to set up your chart, series etc.

These enums are described here.

## LineType

`LineType` enum is used to specify the type of the line for series such as area or line.
It has the following values:

- `LineType.Simple`
- `LineType.WithSteps`

## LineStyle

`LineStyle` enum is used to specify the line style of area and line series, crosshair and grid lines, a priceline and a baseline.
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

## PriceLineSource

`PriceLineSource` enum is used to specify the source of data to be used for the horizontal price line.

It has the following values:

- `PriceLineSource.LastBar` - use the last bar data.
- `PriceLineSource.LastVisible` - use the last visible data of the chart viewport.

## TickMarkType

`TickMarkType` enum is used to specify a type of a tick mark on the time axis.

It has the following values:

- `TickMarkType.Year` - the tick mark represents start of the year (e.g. it's the first tick mark in a year).
- `TickMarkType.Month` - the tick mark represents start of the month (e.g. it's the first tick mark in a month).
- `TickMarkType.DayOfMonth` - the tick mark represents a day of the month.
- `TickMarkType.Time` - the tick mark represents a time without seconds.
- `TickMarkType.TimeWithSeconds` - the tick mark represents a full time format.
