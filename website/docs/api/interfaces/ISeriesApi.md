---
id: "ISeriesApi"
title: "Interface: ISeriesApi<TSeriesType>"
sidebar_label: "ISeriesApi"
sidebar_position: 0
custom_edit_url: null
---

Represents the interface for interacting with series.

## Type parameters

| Name | Type |
| :------ | :------ |
| `TSeriesType` | extends [`SeriesType`](../#seriestype) |

## Methods

### applyOptions

▸ **applyOptions**(`options`): `void`

Applies new options to the existing series

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`SeriesPartialOptionsMap`](SeriesPartialOptionsMap)[`TSeriesType`] | any subset of options |

#### Returns

`void`

___

### barsInLogicalRange

▸ **barsInLogicalRange**(`range`): [`BarsInfo`](../#barsinfo)

Retrieves information about the series' data within a given logical range.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `range` | [`Range`](Range)<`number`\> | the logical range to retrieve info for |

#### Returns

[`BarsInfo`](../#barsinfo)

the bars info for the given logical range: fields `from` and `to` are
`Logical` values for the first and last bar within the range, and `barsBefore` and
`barsAfter` count the the available bars outside the given index range. If these
values are negative, it means that the given range us not fully filled with bars
on the given side, but bars are missing instead (would show up as a margin if the
the given index range falls into the viewport).

___

### coordinateToPrice

▸ **coordinateToPrice**(`coordinate`): [`BarPrice`](../#barprice)

Converts specified coordinate to price value according to the series price scale

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `coordinate` | `number` | input coordinate to be converted |

#### Returns

[`BarPrice`](../#barprice)

price value of the coordinate on the chart

___

### createPriceLine

▸ **createPriceLine**(`options`): [`IPriceLine`](IPriceLine)

Creates a new price line

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`PriceLineOptions`](PriceLineOptions) | any subset of options |

#### Returns

[`IPriceLine`](IPriceLine)

___

### options

▸ **options**(): `Readonly`<[`SeriesOptionsMap`](SeriesOptionsMap)[`TSeriesType`]\>

Returns currently applied options

#### Returns

`Readonly`<[`SeriesOptionsMap`](SeriesOptionsMap)[`TSeriesType`]\>

full set of currently applied options, including defaults

___

### priceFormatter

▸ **priceFormatter**(): [`IPriceFormatter`](IPriceFormatter)

Returns current price formatter

#### Returns

[`IPriceFormatter`](IPriceFormatter)

interface to the price formatter object that can be used to format prices in the same way as the chart does

___

### priceScale

▸ **priceScale**(): [`IPriceScaleApi`](IPriceScaleApi)

Returns interface of the price scale the series is currently attached

#### Returns

[`IPriceScaleApi`](IPriceScaleApi)

IPriceScaleApi object to control the price scale

___

### priceToCoordinate

▸ **priceToCoordinate**(`price`): [`Coordinate`](../#coordinate)

Converts specified series price to pixel coordinate according to the series price scale

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `price` | `number` | input price to be converted |

#### Returns

[`Coordinate`](../#coordinate)

pixel coordinate of the price level on the chart

___

### removePriceLine

▸ **removePriceLine**(`line`): `void`

Removes an existing price line

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `line` | [`IPriceLine`](IPriceLine) | to remove |

#### Returns

`void`

___

### seriesType

▸ **seriesType**(): `TSeriesType`

Return the type of this series

#### Returns

`TSeriesType`

this `SeriesType`

___

### setData

▸ **setData**(`data`): `void`

Sets or replaces series data

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | [`SeriesDataItemTypeMap`](SeriesDataItemTypeMap)[`TSeriesType`][] | ordered (earlier time point goes first) array of data items. Old data is fully replaced with the new one. |

#### Returns

`void`

___

### setMarkers

▸ **setMarkers**(`data`): `void`

Sets markers for the series

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | [`SeriesMarker`](SeriesMarker)<[`Time`](../#time)\>[] | array of series markers. This array should be sorted by time. Several markers with same time are allowed. |

#### Returns

`void`

___

### update

▸ **update**(`bar`): `void`

Adds or replaces a new bar

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `bar` | [`SeriesDataItemTypeMap`](SeriesDataItemTypeMap)[`TSeriesType`] | a single data item to be added. Time of the new item must be greater or equal to the latest existing time point. If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one. |

#### Returns

`void`
