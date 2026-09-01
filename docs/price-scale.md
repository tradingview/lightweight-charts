# Price scale

The **price scale** (or price axis) is a vertical scale that maps prices to coordinates and vice versa.
The conversion rules depend on the price scale mode, the chart's height, and the visible part of the data.

![Price scales](https://tradingview.github.io/lightweight-charts/img/price-scales.png "Price scales")

## Create price scale

By default, a chart has two visible price scales: left and right.
Additionally, you can create an unlimited number of overlay price scales, which remain hidden in the UI.
Overlay price scales allow series to be plotted without affecting the existing visible scales.
This is particularly useful for indicators like Volume, where values can differ significantly from price data.

To create an overlay price scale, assign [`priceScaleId`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon#pricescaleid) to a series.
Note that the `priceScaleId` value should differ from price scale IDs on the left and right.
The chart will create an overlay price scale with the provided ID.

If a price scale with such ID already exists, a series will be attached to the existing price scale.
Further, you can use the provided price scale ID to retrieve its API object using the [`IChartApi.priceScale`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#pricescale) method.

See the [Price and Volume](https://tradingview.github.io/lightweight-charts/tutorials/how_to/price-and-volume.md) article for an example of adding a Volume indicator using an overlay price scale.

## Modify price scale

To modify the left price scale, use the [`leftPriceScale`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ChartOptionsBase#leftpricescale) option.
For the right price scale, use [`rightPriceScale`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ChartOptionsBase#rightpricescale).
To change the default settings for an overlay price scale, use the [`overlayPriceScales`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ChartOptionsBase#overlaypricescales) option.

You can use the [`IChartApi.priceScale`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#pricescale) method to retrieve the API object for any price scale.
Similarly, to access the API object for the price scale that a series is attached to, use the [`ISeriesApi.priceScale`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#pricescale) method.

## Remove price scale

The default left and right price scales cannot be removed, you can only hide them by setting the [`visible`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceScaleOptions#visible) option to `false`.

An overlay price scale exists as long as at least one series is attached to it.
To remove an overlay price scale, remove all series attached to this price scale.

---

Documentation for Lightweight Charts™ v5.2 (latest released version).

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
