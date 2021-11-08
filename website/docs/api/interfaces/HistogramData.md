---
id: "HistogramData"
title: "Interface: HistogramData"
sidebar_label: "HistogramData"
sidebar_position: 0
custom_edit_url: null
---

Structure describing a single item of data for histogram series

## Hierarchy

- [`LineData`](LineData)

  ↳ **`HistogramData`**

## Properties

### color

• `Optional` **color**: `string`

Optional color value for certain data item. If missed, color from HistogramSeriesOptions is used

___

### time

• **time**: [`Time`](../#time)

The time of the data.

#### Inherited from

[LineData](LineData).[time](LineData#time)

___

### value

• **value**: `number`

Price value of the data.

#### Inherited from

[LineData](LineData).[value](LineData#value)
