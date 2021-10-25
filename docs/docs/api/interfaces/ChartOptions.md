---
id: "ChartOptions"
title: "Interface: ChartOptions"
sidebar_label: "ChartOptions"
sidebar_position: 0
custom_edit_url: null
---

Structure describing options of the chart. Series options are to be set separately

## Properties

### crosshair

• **crosshair**: [`CrosshairOptions`](CrosshairOptions)

Crosshair options.

___

### grid

• **grid**: [`GridOptions`](GridOptions)

Grid options.

___

### handleScale

• **handleScale**: `boolean` \| [`HandleScaleOptions`](HandleScaleOptions)

Scale options, or a boolean flag that enables/disables scaling.

___

### handleScroll

• **handleScroll**: `boolean` \| [`HandleScrollOptions`](HandleScrollOptions)

Scroll options, or a boolean flag that enables/disables scrolling.

___

### height

• **height**: `number`

Height of the chart in pixels.

___

### kineticScroll

• **kineticScroll**: [`KineticScrollOptions`](KineticScrollOptions)

Kinetic scroll options.

___

### layout

• **layout**: [`LayoutOptions`](LayoutOptions)

Layout options.

___

### leftPriceScale

• **leftPriceScale**: [`PriceScaleOptions`](PriceScaleOptions)

Left price scale options.

___

### localization

• **localization**: [`LocalizationOptions`](LocalizationOptions)

Localization options.

___

### overlayPriceScales

• **overlayPriceScales**: [`OverlayPriceScaleOptions`](../#overlaypricescaleoptions)

Overlay price scale options.

___

### rightPriceScale

• **rightPriceScale**: [`PriceScaleOptions`](PriceScaleOptions)

Right price scale options.

___

### timeScale

• **timeScale**: [`TimeScaleOptions`](TimeScaleOptions)

Time scale options.

___

### watermark

• **watermark**: [`WatermarkOptions`](WatermarkOptions)

Watermark options.

A watermark is a background label that includes a brief description of the drawn data. Any text can be added to it.

Please make sure you enable it and set an appropriate font color and size to make your watermark visible in the background of the chart.
We recommend a semi-transparent color and a large font. Also note that watermark position can be aligned vertically and horizontally.

___

### width

• **width**: `number`

Width of the chart in pixels.
