---
id: "IChartApi"
title: "Interface: IChartApi"
sidebar_label: "IChartApi"
sidebar_position: 0
custom_edit_url: null
---

The main interface of a single chart.

## Methods

### addAreaSeries

▸ **addAreaSeries**(`areaOptions?`): [`ISeriesApi`](ISeriesApi)<``"Area"``\>

Creates an area series with specified parameters.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `areaOptions?` | [`DeepPartial`](../#deeppartial)<[`AreaStyleOptions`](AreaStyleOptions) & [`SeriesOptionsCommon`](SeriesOptionsCommon)\> | customization parameters of the series being created. |

#### Returns

[`ISeriesApi`](ISeriesApi)<``"Area"``\>

an interface of the created series.

___

### addBarSeries

▸ **addBarSeries**(`barOptions?`): [`ISeriesApi`](ISeriesApi)<``"Bar"``\>

Creates a bar series with specified parameters.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `barOptions?` | [`DeepPartial`](../#deeppartial)<[`BarStyleOptions`](BarStyleOptions) & [`SeriesOptionsCommon`](SeriesOptionsCommon)\> | customization parameters of the series being created. |

#### Returns

[`ISeriesApi`](ISeriesApi)<``"Bar"``\>

an interface of the created series.

___

### addCandlestickSeries

▸ **addCandlestickSeries**(`candlestickOptions?`): [`ISeriesApi`](ISeriesApi)<``"Candlestick"``\>

Creates a candlestick series with specified parameters.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `candlestickOptions?` | [`DeepPartial`](../#deeppartial)<[`CandlestickStyleOptions`](CandlestickStyleOptions) & [`SeriesOptionsCommon`](SeriesOptionsCommon)\> | customization parameters of the series being created. |

#### Returns

[`ISeriesApi`](ISeriesApi)<``"Candlestick"``\>

an interface of the created series.

___

### addHistogramSeries

▸ **addHistogramSeries**(`histogramOptions?`): [`ISeriesApi`](ISeriesApi)<``"Histogram"``\>

Creates a histogram series with specified parameters.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `histogramOptions?` | [`DeepPartial`](../#deeppartial)<[`HistogramStyleOptions`](HistogramStyleOptions) & [`SeriesOptionsCommon`](SeriesOptionsCommon)\> | customization parameters of the series being created. |

#### Returns

[`ISeriesApi`](ISeriesApi)<``"Histogram"``\>

an interface of the created series.

___

### addLineSeries

▸ **addLineSeries**(`lineOptions?`): [`ISeriesApi`](ISeriesApi)<``"Line"``\>

Creates a line series with specified parameters.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `lineOptions?` | [`DeepPartial`](../#deeppartial)<[`LineStyleOptions`](LineStyleOptions) & [`SeriesOptionsCommon`](SeriesOptionsCommon)\> | customization parameters of the series being created. |

#### Returns

[`ISeriesApi`](ISeriesApi)<``"Line"``\>

an interface of the created series.

___

### applyOptions

▸ **applyOptions**(`options`): `void`

Applies new options to the chart

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`DeepPartial`](../#deeppartial)<[`ChartOptions`](ChartOptions)\> | any subset of chart options |

#### Returns

`void`

___

### options

▸ **options**(): `Readonly`<[`ChartOptions`](ChartOptions)\>

Returns currently applied options

#### Returns

`Readonly`<[`ChartOptions`](ChartOptions)\>

full set of currently applied options, including defaults

___

### priceScale

▸ **priceScale**(`priceScaleId?`): [`IPriceScaleApi`](IPriceScaleApi)

Returns API to manipulate a price scale.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `priceScaleId?` | `string` | id of the price scale. |

#### Returns

[`IPriceScaleApi`](IPriceScaleApi)

Price scale API.

___

### remove

▸ **remove**(): `void`

Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

#### Returns

`void`

___

### removeSeries

▸ **removeSeries**(`seriesApi`): `void`

Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it

#### Parameters

| Name | Type |
| :------ | :------ |
| `seriesApi` | [`ISeriesApi`](ISeriesApi)<keyof [`SeriesOptionsMap`](SeriesOptionsMap)\> |

#### Returns

`void`

___

### resize

▸ **resize**(`width`, `height`, `forceRepaint?`): `void`

Sets fixed size of the chart. By default chart takes up 100% of its container.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `width` | `number` | target width of the chart. |
| `height` | `number` | target height of the chart. |
| `forceRepaint?` | `boolean` | true to initiate resize immediately. One could need this to get screenshot immediately after resize. |

#### Returns

`void`

___

### subscribeClick

▸ **subscribeClick**(`handler`): `void`

Subscribe to the chart click event.

**`example`**
```js
function myClickHandler(param) {
    if (!param.point) {
        return;
    }

    console.log(`Click at ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);
}

chart.subscribeClick(myClickHandler);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `handler` | [`MouseEventHandler`](../#mouseeventhandler) | handler to be called on mouse click. |

#### Returns

`void`

___

### subscribeCrosshairMove

▸ **subscribeCrosshairMove**(`handler`): `void`

Subscribe to the crosshair move event.

**`example`**
```js
function myCrosshairMoveHandler(param) {
    if (!param.point) {
        return;
    }

    console.log(`Crosshair moved to ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);
}

chart.subscribeClick(myCrosshairMoveHandler);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `handler` | [`MouseEventHandler`](../#mouseeventhandler) | handler to be called on crosshair move. |

#### Returns

`void`

___

### takeScreenshot

▸ **takeScreenshot**(): `HTMLCanvasElement`

Make a screenshot of the chart with all the elements excluding crosshair.

#### Returns

`HTMLCanvasElement`

a canvas with the chart drawn on

___

### timeScale

▸ **timeScale**(): [`ITimeScaleApi`](ITimeScaleApi)

Returns API to manipulate the time scale

#### Returns

[`ITimeScaleApi`](ITimeScaleApi)

target API

___

### unsubscribeClick

▸ **unsubscribeClick**(`handler`): `void`

Unsubscribe a handler that was previously subscribed using [subscribeClick](IChartApi#subscribeclick).

**`example`**
```js
chart.unsubscribeClick(myClickHandler);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `handler` | [`MouseEventHandler`](../#mouseeventhandler) | previously subscribed handler |

#### Returns

`void`

___

### unsubscribeCrosshairMove

▸ **unsubscribeCrosshairMove**(`handler`): `void`

Unsubscribe a handler that was previously subscribed using [subscribeCrosshairMove](IChartApi#subscribecrosshairmove).

**`example`**
```js
chart.unsubscribeCrosshairMove(myCrosshairMoveHandler);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `handler` | [`MouseEventHandler`](../#mouseeventhandler) | previously subscribed handler |

#### Returns

`void`
