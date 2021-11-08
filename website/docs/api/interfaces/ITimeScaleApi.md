---
id: "ITimeScaleApi"
title: "Interface: ITimeScaleApi"
sidebar_label: "ITimeScaleApi"
sidebar_position: 0
custom_edit_url: null
---

Interface to chart time scale

## Methods

### applyOptions

▸ **applyOptions**(`options`): `void`

Applies new options to the time scale.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`DeepPartial`](../#deeppartial)<[`TimeScaleOptions`](TimeScaleOptions)\> | any subset of options |

#### Returns

`void`

___

### coordinateToLogical

▸ **coordinateToLogical**(`x`): [`Logical`](../#logical)

Converts a coordinate to logical index.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `x` | `number` | coordinate needs to be converted |

#### Returns

[`Logical`](../#logical)

logical index that is located on that coordinate or `null` if the chart doesn't have data

___

### coordinateToTime

▸ **coordinateToTime**(`x`): [`Time`](../#time)

Converts a coordinate to time.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `x` | `number` | coordinate needs to be converted. |

#### Returns

[`Time`](../#time)

time of a bar that is located on that coordinate or `null` if there are no bars found on that coordinate.

___

### fitContent

▸ **fitContent**(): `void`

Automatically calculates the visible range to fit all data from all series.

#### Returns

`void`

___

### getVisibleLogicalRange

▸ **getVisibleLogicalRange**(): [`LogicalRange`](../#logicalrange)

Returns the current visible [logical range](#logical-range) of the chart as an object with the first and last time points of the logical range, or returns `null` if the chart has no data.

#### Returns

[`LogicalRange`](../#logicalrange)

visible range or null if the chart has no data at all.

___

### getVisibleRange

▸ **getVisibleRange**(): [`TimeRange`](../#timerange)

Returns current visible time range of the chart.

#### Returns

[`TimeRange`](../#timerange)

visible range or null if the chart has no data at all.

___

### height

▸ **height**(): `number`

Returns a height of the time scale.

#### Returns

`number`

___

### logicalToCoordinate

▸ **logicalToCoordinate**(`logical`): [`Coordinate`](../#coordinate)

Converts a logical index to local x coordinate.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `logical` | [`Logical`](../#logical) | logical index needs to be converted |

#### Returns

[`Coordinate`](../#coordinate)

x coordinate of that time or `null` if the chart doesn't have data

___

### options

▸ **options**(): `Readonly`<[`TimeScaleOptions`](TimeScaleOptions)\>

Returns current options

#### Returns

`Readonly`<[`TimeScaleOptions`](TimeScaleOptions)\>

currently applied options

___

### resetTimeScale

▸ **resetTimeScale**(): `void`

Restores default zoom level and scroll position of the time scale.

#### Returns

`void`

___

### scrollPosition

▸ **scrollPosition**(): `number`

Return the distance from the right edge of the time scale to the lastest bar of the series measured in bars.

#### Returns

`number`

a distance from the right edge to the latest bar, measured in bars.

___

### scrollToPosition

▸ **scrollToPosition**(`position`, `animated`): `void`

Scrolls the chart to the specified position.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `position` | `number` | target data position |
| `animated` | `boolean` | setting this to true makes the chart scrolling smooth and adds animation |

#### Returns

`void`

___

### scrollToRealTime

▸ **scrollToRealTime**(): `void`

Restores default scroll position of the chart. This process is always animated.

#### Returns

`void`

___

### setVisibleLogicalRange

▸ **setVisibleLogicalRange**(`range`): `void`

Sets visible logical range of data.

**`example`**
```js
chart.timeScale().setVisibleLogicalRange({ from: 0, to: Date.now() / 1000 });
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `range` | [`Range`](Range)<`number`\> | target visible logical range of data. |

#### Returns

`void`

___

### setVisibleRange

▸ **setVisibleRange**(`range`): `void`

Sets visible range of data.

**`example`**
```js
chart.timeScale().setVisibleRange({
    from: (new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0))).getTime() / 1000,
    to: (new Date(Date.UTC(2018, 1, 1, 0, 0, 0, 0))).getTime() / 1000,
});
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `range` | [`TimeRange`](../#timerange) | target visible range of data. |

#### Returns

`void`

___

### subscribeSizeChange

▸ **subscribeSizeChange**(`handler`): `void`

Adds a subscription to time scale size changes

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `handler` | [`SizeChangeEventHandler`](../#sizechangeeventhandler) | handler (function) to be called when the time scale size changes |

#### Returns

`void`

___

### subscribeVisibleLogicalRangeChange

▸ **subscribeVisibleLogicalRangeChange**(`handler`): `void`

Subscribe to the visible logical range change events.

The argument passed to the handler function is an object with `from` and `to` properties of type `number`, or `null` if there is no visible data.

**`example`**
```js
function myVisibleLogicalRangeChangeHandler(newVisibleLogicalRange) {
    if (newVisibleLogicalRange === null) {
        // handle null
    }

    // handle new logical range
}

chart.timeScale().subscribeVisibleLogicalRangeChange(myVisibleLogicalRangeChangeHandler);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `handler` | [`LogicalRangeChangeEventHandler`](../#logicalrangechangeeventhandler) | handler (function) to be called when the visible indexes change. |

#### Returns

`void`

___

### subscribeVisibleTimeRangeChange

▸ **subscribeVisibleTimeRangeChange**(`handler`): `void`

Subscribe to the visible time range change events.

The argument passed to the handler function is an object with `from` and `to` properties of type [Time](../enums/TickMarkType#time), or `null` if there is no visible data.

**`example`**
```js
function myVisibleTimeRangeChangeHandler(newVisibleTimeRange) {
    if (newVisibleTimeRange === null) {
        // handle null
    }

    // handle new logical range
}

chart.timeScale().subscribeVisibleTimeRangeChange(myVisibleTimeRangeChangeHandler);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `handler` | [`TimeRangeChangeEventHandler`](../#timerangechangeeventhandler) | handler (function) to be called when the visible indexes change. |

#### Returns

`void`

___

### timeToCoordinate

▸ **timeToCoordinate**(`time`): [`Coordinate`](../#coordinate)

Converts a time to local x coordinate.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `time` | [`Time`](../#time) | time needs to be converted |

#### Returns

[`Coordinate`](../#coordinate)

x coordinate of that time or `null` if no time found on time scale

___

### unsubscribeSizeChange

▸ **unsubscribeSizeChange**(`handler`): `void`

Removes a subscription to time scale size changes

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `handler` | [`SizeChangeEventHandler`](../#sizechangeeventhandler) | previously subscribed handler |

#### Returns

`void`

___

### unsubscribeVisibleLogicalRangeChange

▸ **unsubscribeVisibleLogicalRangeChange**(`handler`): `void`

Unsubscribe a handler that was previously subscribed using [subscribeVisibleLogicalRangeChange](ITimeScaleApi#subscribevisiblelogicalrangechange).

**`example`**
```js
chart.timeScale().unsubscribeVisibleLogicalRangeChange(myVisibleLogicalRangeChangeHandler);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `handler` | [`LogicalRangeChangeEventHandler`](../#logicalrangechangeeventhandler) | previously subscribed handler |

#### Returns

`void`

___

### unsubscribeVisibleTimeRangeChange

▸ **unsubscribeVisibleTimeRangeChange**(`handler`): `void`

Unsubscribe a handler that was previously subscribed using [subscribeVisibleTimeRangeChange](ITimeScaleApi#subscribevisibletimerangechange).

**`example`**
```js
chart.timeScale().unsubscribeVisibleTimeRangeChange(myVisibleTimeRangeChangeHandler);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `handler` | [`TimeRangeChangeEventHandler`](../#timerangechangeeventhandler) | previously subscribed handler |

#### Returns

`void`

___

### width

▸ **width**(): `number`

Returns a width of the time scale.

#### Returns

`number`
