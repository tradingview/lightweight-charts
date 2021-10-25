---
id: "PriceScaleOptions"
title: "Interface: PriceScaleOptions"
sidebar_label: "PriceScaleOptions"
sidebar_position: 0
custom_edit_url: null
---

Structure that describes price scale options

## Properties

### alignLabels

• **alignLabels**: `boolean`

Align price scale labels to prevent them from overlapping.

___

### autoScale

• **autoScale**: `boolean`

Automatically set price range based on visible data range.

___

### borderColor

• **borderColor**: `string`

Price scale border color.

___

### borderVisible

• **borderVisible**: `boolean`

Set true to draw a border between the price scale and the chart area.

___

### drawTicks

• **drawTicks**: `boolean`

Draw small horizontal line on price axis labels.

___

### entireTextOnly

• **entireTextOnly**: `boolean`

Show top and bottom corner labels only if entire text is visible.

___

### invertScale

• **invertScale**: `boolean`

Invert the price scale, so that a upwards trend is shown as a downwards trend and vice versa.
Affects both the price scale and the data on the chart.

___

### mode

• **mode**: [`PriceScaleMode`](../enums/PriceScaleMode)

Price scale mode.

___

### scaleMargins

• **scaleMargins**: [`PriceScaleMargins`](PriceScaleMargins)

Price scale margins.

___

### visible

• **visible**: `boolean`

Indicates if this price scale visible. Ignored by overlay price scales.
