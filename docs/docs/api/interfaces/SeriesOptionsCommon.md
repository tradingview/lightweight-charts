---
id: "SeriesOptionsCommon"
title: "Interface: SeriesOptionsCommon"
sidebar_label: "SeriesOptionsCommon"
sidebar_position: 0
custom_edit_url: null
---

Represents options common for all types of series

## Properties

### autoscaleInfoProvider

• `Optional` **autoscaleInfoProvider**: [`AutoscaleInfoProvider`](../#autoscaleinfoprovider)

Override the default [AutoscaleInfo](AutoscaleInfo) provider.

___

### baseLineColor

• **baseLineColor**: `string`

Color of the base line in `IndexedTo100` mode.

___

### baseLineStyle

• **baseLineStyle**: [`LineStyle`](../enums/LineStyle)

Base line style. Suitable for percentage and indexedTo100 scales.

___

### baseLineVisible

• **baseLineVisible**: `boolean`

Visibility of base line. Suitable for percentage and `IndexedTo100` scales.

___

### baseLineWidth

• **baseLineWidth**: [`LineWidth`](../#linewidth)

Base line width. Suitable for percentage and `IndexedTo10` scales.

___

### lastValueVisible

• **lastValueVisible**: `boolean`

Visibility of the label with the latest visible price on the price scale.

___

### priceFormat

• **priceFormat**: [`PriceFormat`](../#priceformat)

Price format.

___

### priceLineColor

• **priceLineColor**: `string`

Color of the price line.

___

### priceLineSource

• **priceLineSource**: [`PriceLineSource`](../enums/PriceLineSource)

The source to use for the value of the price line.

___

### priceLineStyle

• **priceLineStyle**: [`LineStyle`](../enums/LineStyle)

Price line style.

___

### priceLineVisible

• **priceLineVisible**: `boolean`

Show the price line. Price line is a horizontal line indicating the last price of the series.

___

### priceLineWidth

• **priceLineWidth**: [`LineWidth`](../#linewidth)

Width of the price line.

___

### priceScaleId

• `Optional` **priceScaleId**: `string`

Target price scale to bind new series to

___

### scaleMargins

• `Optional` **scaleMargins**: [`PriceScaleMargins`](PriceScaleMargins)

**`deprecated`** Use priceScale method of the series to apply options instead.

___

### title

• **title**: `string`

Title of the series. This label is placed with price axis label

___

### visible

• **visible**: `boolean`

Show the series.
