---
id: "MouseEventParams"
title: "Interface: MouseEventParams"
sidebar_label: "MouseEventParams"
sidebar_position: 0
custom_edit_url: null
---

Represents a mouse event.

## Properties

### hoveredMarkerId

• `Optional` **hoveredMarkerId**: `string`

The ID of the marker at the point of the mouse event.

___

### hoveredSeries

• `Optional` **hoveredSeries**: [`ISeriesApi`](ISeriesApi)<keyof [`SeriesOptionsMap`](SeriesOptionsMap)\>

The [ISeriesApi](ISeriesApi) for the series at the point of the mouse event.

___

### point

• `Optional` **point**: [`Point`](Point)

Location of the event in the chart.

The value will be `undefined` if the event is fired outside the chart, for example a mouse leave event.

___

### seriesPrices

• **seriesPrices**: `Map`<[`ISeriesApi`](ISeriesApi)<keyof [`SeriesOptionsMap`](SeriesOptionsMap)\>, [`BarPrice`](../#barprice) \| [`BarPrices`](BarPrices)\>

Prices of all series at the location of the event in the chart.

Keys of the map are [ISeriesApi](ISeriesApi) instances. Values are prices.
Each price is a number for line, area, and histogram series or a OHLC object for candlestick and bar series.

___

### time

• `Optional` **time**: [`UTCTimestamp`](../#utctimestamp) \| [`BusinessDay`](BusinessDay)

Time of the data at the location of the mouse event.

The value will be `undefined` if the location of the event in the chart is outside the range of available data.
