---
id: "index"
title: "lightweight-charts"
slug: "/api/"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## Enumerations

- [ColorType](enums/ColorType)
- [CrosshairMode](enums/CrosshairMode)
- [LastPriceAnimationMode](enums/LastPriceAnimationMode)
- [LineStyle](enums/LineStyle)
- [LineType](enums/LineType)
- [PriceLineSource](enums/PriceLineSource)
- [PriceScaleMode](enums/PriceScaleMode)
- [TickMarkType](enums/TickMarkType)

## Interfaces

- [AreaStyleOptions](interfaces/AreaStyleOptions)
- [AutoScaleMargins](interfaces/AutoScaleMargins)
- [AutoscaleInfo](interfaces/AutoscaleInfo)
- [AxisPressedMouseMoveOptions](interfaces/AxisPressedMouseMoveOptions)
- [BarData](interfaces/BarData)
- [BarPrices](interfaces/BarPrices)
- [BarStyleOptions](interfaces/BarStyleOptions)
- [BusinessDay](interfaces/BusinessDay)
- [CandlestickStyleOptions](interfaces/CandlestickStyleOptions)
- [ChartOptions](interfaces/ChartOptions)
- [CrosshairLineOptions](interfaces/CrosshairLineOptions)
- [CrosshairOptions](interfaces/CrosshairOptions)
- [GridLineOptions](interfaces/GridLineOptions)
- [GridOptions](interfaces/GridOptions)
- [HandleScaleOptions](interfaces/HandleScaleOptions)
- [HandleScrollOptions](interfaces/HandleScrollOptions)
- [HistogramData](interfaces/HistogramData)
- [HistogramStyleOptions](interfaces/HistogramStyleOptions)
- [IChartApi](interfaces/IChartApi)
- [IPriceFormatter](interfaces/IPriceFormatter)
- [IPriceLine](interfaces/IPriceLine)
- [IPriceScaleApi](interfaces/IPriceScaleApi)
- [ISeriesApi](interfaces/ISeriesApi)
- [ITimeScaleApi](interfaces/ITimeScaleApi)
- [KineticScrollOptions](interfaces/KineticScrollOptions)
- [LayoutOptions](interfaces/LayoutOptions)
- [LineData](interfaces/LineData)
- [LineStyleOptions](interfaces/LineStyleOptions)
- [LocalizationOptions](interfaces/LocalizationOptions)
- [MouseEventParams](interfaces/MouseEventParams)
- [Point](interfaces/Point)
- [PriceFormatBuiltIn](interfaces/PriceFormatBuiltIn)
- [PriceFormatCustom](interfaces/PriceFormatCustom)
- [PriceLineOptions](interfaces/PriceLineOptions)
- [PriceRange](interfaces/PriceRange)
- [PriceScaleMargins](interfaces/PriceScaleMargins)
- [PriceScaleOptions](interfaces/PriceScaleOptions)
- [Range](interfaces/Range)
- [SeriesDataItemTypeMap](interfaces/SeriesDataItemTypeMap)
- [SeriesMarker](interfaces/SeriesMarker)
- [SeriesOptionsCommon](interfaces/SeriesOptionsCommon)
- [SeriesOptionsMap](interfaces/SeriesOptionsMap)
- [SeriesPartialOptionsMap](interfaces/SeriesPartialOptionsMap)
- [SolidColor](interfaces/SolidColor)
- [TimeScaleOptions](interfaces/TimeScaleOptions)
- [VerticalGradientColor](interfaces/VerticalGradientColor)
- [WatermarkOptions](interfaces/WatermarkOptions)
- [WhitespaceData](interfaces/WhitespaceData)

## References

### LasPriceAnimationMode

Renames and re-exports [LastPriceAnimationMode](enums/LastPriceAnimationMode)

## Type aliases

### AreaSeriesOptions

Ƭ **AreaSeriesOptions**: [`SeriesOptions`](#seriesoptions)<[`AreaStyleOptions`](interfaces/AreaStyleOptions)\>

Represents area series options.

___

### AreaSeriesPartialOptions

Ƭ **AreaSeriesPartialOptions**: [`SeriesPartialOptions`](#seriespartialoptions)<[`AreaStyleOptions`](interfaces/AreaStyleOptions)\>

Represents area series options where all properties are optional.

___

### AutoscaleInfoProvider

Ƭ **AutoscaleInfoProvider**: (`baseImplementation`: () => [`AutoscaleInfo`](interfaces/AutoscaleInfo) \| ``null``) => [`AutoscaleInfo`](interfaces/AutoscaleInfo) \| ``null``

#### Type declaration

▸ (`baseImplementation`): [`AutoscaleInfo`](interfaces/AutoscaleInfo) \| ``null``

A custom function used to get autoscale information.

##### Parameters

| Name | Type |
| :------ | :------ |
| `baseImplementation` | () => [`AutoscaleInfo`](interfaces/AutoscaleInfo) \| ``null`` |

##### Returns

[`AutoscaleInfo`](interfaces/AutoscaleInfo) \| ``null``

___

### Background

Ƭ **Background**: [`SolidColor`](interfaces/SolidColor) \| [`VerticalGradientColor`](interfaces/VerticalGradientColor)

Represents the background color of the chart.

___

### BarPrice

Ƭ **BarPrice**: [`Nominal`](#nominal)<`number`, ``"BarPrice"``\>

Represents a price as a `number`.

___

### BarSeriesOptions

Ƭ **BarSeriesOptions**: [`SeriesOptions`](#seriesoptions)<[`BarStyleOptions`](interfaces/BarStyleOptions)\>

Represents bar series options.

___

### BarSeriesPartialOptions

Ƭ **BarSeriesPartialOptions**: [`SeriesPartialOptions`](#seriespartialoptions)<[`BarStyleOptions`](interfaces/BarStyleOptions)\>

Represents bar series options where all properties are optiona.

___

### BarsInfo

Ƭ **BarsInfo**: `Partial`<[`Range`](interfaces/Range)<[`Time`](#time)\>\> & { `barsAfter`: `number` ; `barsBefore`: `number`  }

Represents a range of bars and the number of bars outside the range.

___

### CandlestickSeriesOptions

Ƭ **CandlestickSeriesOptions**: [`SeriesOptions`](#seriesoptions)<[`CandlestickStyleOptions`](interfaces/CandlestickStyleOptions)\>

Represents candlestick series options.

___

### CandlestickSeriesPartialOptions

Ƭ **CandlestickSeriesPartialOptions**: [`SeriesPartialOptions`](#seriespartialoptions)<[`CandlestickStyleOptions`](interfaces/CandlestickStyleOptions)\>

Represents candlestick series options where all properties are optional.

___

### Coordinate

Ƭ **Coordinate**: [`Nominal`](#nominal)<`number`, ``"Coordinate"``\>

Represents a coordiate as a `number`.

___

### DeepPartial

Ƭ **DeepPartial**<`T`\>: { [P in keyof T]?: T[P] extends infer U[] ? DeepPartial<U\>[] : T[P] extends readonly infer X[] ? readonly DeepPartial<X\>[] : DeepPartial<T[P]\> }

Represents a type `T` where every property is optional.

#### Type parameters

| Name |
| :------ |
| `T` |

___

### HistogramSeriesOptions

Ƭ **HistogramSeriesOptions**: [`SeriesOptions`](#seriesoptions)<[`HistogramStyleOptions`](interfaces/HistogramStyleOptions)\>

Represents histogram series options.

___

### HistogramSeriesPartialOptions

Ƭ **HistogramSeriesPartialOptions**: [`SeriesPartialOptions`](#seriespartialoptions)<[`HistogramStyleOptions`](interfaces/HistogramStyleOptions)\>

Represents histogram series options where all properties are optional.

___

### HorzAlign

Ƭ **HorzAlign**: ``"left"`` \| ``"center"`` \| ``"right"``

Represents a horizontal alignment.

___

### LineSeriesOptions

Ƭ **LineSeriesOptions**: [`SeriesOptions`](#seriesoptions)<[`LineStyleOptions`](interfaces/LineStyleOptions)\>

Represents line series options.

___

### LineSeriesPartialOptions

Ƭ **LineSeriesPartialOptions**: [`SeriesPartialOptions`](#seriespartialoptions)<[`LineStyleOptions`](interfaces/LineStyleOptions)\>

Represents line series options where all properties are optional.

___

### LineWidth

Ƭ **LineWidth**: ``1`` \| ``2`` \| ``3`` \| ``4``

Represents the width of a line.

___

### Logical

Ƭ **Logical**: [`Nominal`](#nominal)<`number`, ``"Logical"``\>

Represents the to or from `number` in a logical range.

___

### LogicalRange

Ƭ **LogicalRange**: [`Range`](interfaces/Range)<[`Logical`](#logical)\>

A logical range is an object with 2 properties: `from` and `to`, which are numbers and represent logical indexes on the time scale.

The starting point of the time scale's logical range is the first data item among all series.
Before that point all indexes are negative, starting from that point - positive.

Indexes might have fractional parts, for instance 4.2, due to the time-scale being continuous rather than discrete.

Integer part of the logical index means index of the fully visible bar.
Thus, if we have 5.2 as the last visible logical index (`to` field), that means that the last visible bar has index 5, but we also have partially visible (for 20%) 6th bar.
Half (e.g. 1.5, 3.5, 10.5) means exactly a middle of the bar.

___

### LogicalRangeChangeEventHandler

Ƭ **LogicalRangeChangeEventHandler**: (`logicalRange`: [`LogicalRange`](#logicalrange) \| ``null``) => `void`

#### Type declaration

▸ (`logicalRange`): `void`

A custom function used to handle changes to the time scale's logical range.

##### Parameters

| Name | Type |
| :------ | :------ |
| `logicalRange` | [`LogicalRange`](#logicalrange) \| ``null`` |

##### Returns

`void`

___

### MouseEventHandler

Ƭ **MouseEventHandler**: (`param`: [`MouseEventParams`](interfaces/MouseEventParams)) => `void`

#### Type declaration

▸ (`param`): `void`

A custom function use to handle mouse events.

##### Parameters

| Name | Type |
| :------ | :------ |
| `param` | [`MouseEventParams`](interfaces/MouseEventParams) |

##### Returns

`void`

___

### Nominal

Ƭ **Nominal**<`T`, `Name`\>: `T` & { `[species]`: `Name`  }

This is the generic type useful for declaring a nominal type,
which does not structurally matches with the base type and
the other types declared over the same base type

Usage:

**`example`**
type Index = Nominal<number, 'Index'>;
// let i: Index = 42; // this fails to compile
let i: Index = 42 as Index; // OK

**`example`**
type TagName = Nominal<string, 'TagName'>;

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `T` |
| `Name` | extends `string` |

___

### OverlayPriceScaleOptions

Ƭ **OverlayPriceScaleOptions**: `Omit`<[`PriceScaleOptions`](interfaces/PriceScaleOptions), ``"visible"`` \| ``"autoScale"``\>

Represents overlay price scale options.

___

### PriceFormat

Ƭ **PriceFormat**: [`PriceFormatBuiltIn`](interfaces/PriceFormatBuiltIn) \| [`PriceFormatCustom`](interfaces/PriceFormatCustom)

Represents information used to format prices.

___

### PriceFormatterFn

Ƭ **PriceFormatterFn**: (`priceValue`: [`BarPrice`](#barprice)) => `string`

#### Type declaration

▸ (`priceValue`): `string`

A function used to format a [BarPrice](#barprice) as a string.

##### Parameters

| Name | Type |
| :------ | :------ |
| `priceValue` | [`BarPrice`](#barprice) |

##### Returns

`string`

___

### SeriesMarkerPosition

Ƭ **SeriesMarkerPosition**: ``"aboveBar"`` \| ``"belowBar"`` \| ``"inBar"``

Represents the position of a series marker relative to a bar.

___

### SeriesMarkerShape

Ƭ **SeriesMarkerShape**: ``"circle"`` \| ``"square"`` \| ``"arrowUp"`` \| ``"arrowDown"``

Represents the shape of a series marker.

___

### SeriesOptions

Ƭ **SeriesOptions**<`T`\>: `T` & [`SeriesOptionsCommon`](interfaces/SeriesOptionsCommon)

Represents the intersection of a series type `T`'s options and common series options.

**`see`** [SeriesOptionsCommon](interfaces/SeriesOptionsCommon) for common options.

#### Type parameters

| Name |
| :------ |
| `T` |

___

### SeriesPartialOptions

Ƭ **SeriesPartialOptions**<`T`\>: [`DeepPartial`](#deeppartial)<`T` & [`SeriesOptionsCommon`](interfaces/SeriesOptionsCommon)\>

Represents a [SeriesOptions](#seriesoptions) where every property is optional.

#### Type parameters

| Name |
| :------ |
| `T` |

___

### SeriesType

Ƭ **SeriesType**: keyof [`SeriesOptionsMap`](interfaces/SeriesOptionsMap)

Represents a type of series.

**`see`** [SeriesOptionsMap](interfaces/SeriesOptionsMap)

___

### SizeChangeEventHandler

Ƭ **SizeChangeEventHandler**: (`width`: `number`, `height`: `number`) => `void`

#### Type declaration

▸ (`width`, `height`): `void`

A custom function used to handle changes to the time scale's size.

##### Parameters

| Name | Type |
| :------ | :------ |
| `width` | `number` |
| `height` | `number` |

##### Returns

`void`

___

### TickMarkFormatter

Ƭ **TickMarkFormatter**: (`time`: [`UTCTimestamp`](#utctimestamp) \| [`BusinessDay`](interfaces/BusinessDay), `tickMarkType`: [`TickMarkType`](enums/TickMarkType), `locale`: `string`) => `string`

#### Type declaration

▸ (`time`, `tickMarkType`, `locale`): `string`

The `TickMarkFormatter` is used to customize tick mark labels on the time scale.

This function should return `time` as a string formatted according to `tickMarkType` type (year, month, etc) and `locale`.

Note that the returned string should be the shortest possible value and should have no more than 8 characters.
Otherwise, the tick marks will overlap each other.

```js
const customFormatter = (time, tickMarkType, locale) => { ... }
```

##### Parameters

| Name | Type |
| :------ | :------ |
| `time` | [`UTCTimestamp`](#utctimestamp) \| [`BusinessDay`](interfaces/BusinessDay) |
| `tickMarkType` | [`TickMarkType`](enums/TickMarkType) |
| `locale` | `string` |

##### Returns

`string`

___

### Time

Ƭ **Time**: [`UTCTimestamp`](#utctimestamp) \| [`BusinessDay`](interfaces/BusinessDay) \| `string`

The Time type is used to represent the time of data items.

Values can be a [UTCTimestamp](#utctimestamp), a [BusinessDay](interfaces/BusinessDay), or a business day string in ISO format.

**`example`**
```js
const timestamp = 1529899200; // Literal timestamp representing 2018-06-25T04:00:00.000Z
const businessDay = { year: 2019, month: 6, day: 1 }; // June 1, 2019
const businessDayString = '2021-02-03'; // Business day string literal
```

___

### TimeFormatterFn

Ƭ **TimeFormatterFn**: (`time`: [`BusinessDay`](interfaces/BusinessDay) \| [`UTCTimestamp`](#utctimestamp)) => `string`

#### Type declaration

▸ (`time`): `string`

A custom function used to override formatting of a time to a string.

##### Parameters

| Name | Type |
| :------ | :------ |
| `time` | [`BusinessDay`](interfaces/BusinessDay) \| [`UTCTimestamp`](#utctimestamp) |

##### Returns

`string`

___

### TimeRange

Ƭ **TimeRange**: [`Range`](interfaces/Range)<[`Time`](#time)\>

Represents a [Time](enums/TickMarkType#time) range.

___

### TimeRangeChangeEventHandler

Ƭ **TimeRangeChangeEventHandler**: (`timeRange`: [`TimeRange`](#timerange) \| ``null``) => `void`

#### Type declaration

▸ (`timeRange`): `void`

A custom function used to handle changes to the time scale's time range.

##### Parameters

| Name | Type |
| :------ | :------ |
| `timeRange` | [`TimeRange`](#timerange) \| ``null`` |

##### Returns

`void`

___

### UTCTimestamp

Ƭ **UTCTimestamp**: [`Nominal`](#nominal)<`number`, ``"UTCTimestamp"``\>

Represents a time a a UNIX timestamp.

If your chart displays an intraday interval you should use a UNIX Timestamp.

Note that JavaScript Date APIs like `Date.now` return a number of milliseconds but UTCTimestamp expects a number of seconds.

Note that to prevent errors, you should cast the numeric type of the time to `UTCTimestamp` type from the package (`value as UTCTimestamp`) in TypeScript code.

**`example`**
```ts
const timestamp = 1529899200 as UTCTimestamp; // Literal timestamp representing 2018-06-25T04:00:00.000Z
const timestamp2 = (Date.now() / 1000) as UTCTimestamp;
```

___

### VertAlign

Ƭ **VertAlign**: ``"top"`` \| ``"center"`` \| ``"bottom"``

Represents a vertical alignment.

___

### VisiblePriceScaleOptions

Ƭ **VisiblePriceScaleOptions**: [`PriceScaleOptions`](interfaces/PriceScaleOptions)

Represents a visible price scale's options.

**`see`** [PriceScaleOptions](interfaces/PriceScaleOptions)

## Functions

### createChart

▸ **createChart**(`container`, `options?`): [`IChartApi`](interfaces/IChartApi)

This function is the main entry point of the Lightweight Charting Library.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `container` | `string` \| `HTMLElement` | id of HTML element or element itself |
| `options?` | [`DeepPartial`](#deeppartial)<[`ChartOptions`](interfaces/ChartOptions)\> | any subset of ChartOptions to be applied at start. |

#### Returns

[`IChartApi`](interfaces/IChartApi)

An interface to the created chart

___

### isBusinessDay

▸ **isBusinessDay**(`time`): time is BusinessDay

Check if a time value is a business day object.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `time` | [`Time`](#time) | The time to check. |

#### Returns

time is BusinessDay

`true` if `time` is a [BusinessDay](interfaces/BusinessDay) object, false otherwise.

___

### isUTCTimestamp

▸ **isUTCTimestamp**(`time`): time is UTCTimestamp

Check if a time value is a UTC timestamp number.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `time` | [`Time`](#time) | The time to check. |

#### Returns

time is UTCTimestamp

`true` if `time` is a [UTCTimestamp](#utctimestamp) number, false otherwise.

___

### version

▸ **version**(): `string`

Returns the current version as a string. For example `'3.3.0'`.

#### Returns

`string`

The version string.
