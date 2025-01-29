---
sidebar_position: 3
---

# Price scale

The **price scale** (or price axis) is a vertical scale that maps prices to coordinates and vice versa.
The conversion rules depend on the price scale mode, the chart's height, and the visible part of the data.

![Price scales](/img/price-scales.png "Price scales")

## Create price scale

By default, a chart has two visible price scales: left and right.
Additionally, you can create an unlimited number of overlay price scales, which remain hidden in the UI.
Overlay price scales allow series to be plotted without affecting the existing visible scales.
This is particularly useful for indicators like Volume, where values can differ significantly from price data.

To create an overlay price scale, assign [`priceScaleId`](/api/interfaces/SeriesOptionsCommon.md#pricescaleid) to a series.
Note that the `priceScaleId` value should differ from price scale IDs on the left and right.
The chart will create an overlay price scale with the provided ID.

If a price scale with such ID already exists, a series will be attached to the existing price scale.
Further, you can use the provided price scale ID to retrieve its API object using the [`IChartApi.priceScale`](/api/interfaces/IChartApi.md#pricescale) method.

See the [Price and Volume](/tutorials/how_to/price-and-volume) article for an example of adding a Volume indicator using an overlay price scale.

## Modify price scale

To modify the left price scale, use the [`leftPriceScale`](/api/interfaces/ChartOptionsBase.md#leftpricescale) option.
For the right price scale, use [`rightPriceScale`](/api/interfaces/ChartOptionsBase.md#rightpricescale).
To change the default settings for an overlay price scale, use the [`overlayPriceScales`](/api/interfaces/ChartOptionsBase.md#overlaypricescales) option.

You can use the [`IChartApi.priceScale`](/api/interfaces/IChartApi.md#pricescale) method to retrieve the API object for any price scale.
Similarly, to access the API object for the price scale that a series is attached to, use the [`ISeriesApi.priceScale`](/api/interfaces/ISeriesApi.md#pricescale) method.

## Remove price scale

The default left and right price scales cannot be removed, you can only hide them by setting the [`visible`](/api/interfaces/PriceScaleOptions.md#visible) option to `false`.

An overlay price scale exists as long as at least one series is attached to it.
To remove an overlay price scale, remove all series attached to this price scale.

<!-- Note that this method is not implemented yet :(
## Equality of price scale API objects

`lightweight-charts` library does not guarantee to return the same reference of [`IPriceScaleApi`](/api/interfaces/IPriceScaleApi.md) object for the same price scale ID.
So you should never compare these objects by a reference, use the result from [`IPriceScaleApi.id`](/api/interfaces/IPriceScaleApi.md#id) method instead.
-->
