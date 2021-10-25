---
id: "TimeScaleOptions"
title: "Interface: TimeScaleOptions"
sidebar_label: "TimeScaleOptions"
sidebar_position: 0
custom_edit_url: null
---

Options for the time scale; the horizontal scale at the bottom of the chart that displays the time of data.

## Properties

### barSpacing

• **barSpacing**: `number`

The space between bars in pixels.

___

### borderColor

• **borderColor**: `string`

The time scale border color.

___

### borderVisible

• **borderVisible**: `boolean`

Show the time scale border.

___

### fixLeftEdge

• **fixLeftEdge**: `boolean`

Prevent scrolling to the left of the first bar.

___

### fixRightEdge

• **fixRightEdge**: `boolean`

Prevent scrolling to the right of the most recent bar.

___

### lockVisibleTimeRangeOnResize

• **lockVisibleTimeRangeOnResize**: `boolean`

Prevent changing the visible time range during chart resizing.

___

### minBarSpacing

• **minBarSpacing**: `number`

The minimum space between bars in pixels.

___

### rightBarStaysOnScroll

• **rightBarStaysOnScroll**: `boolean`

Prevent the hovered bar from moving when scrolling.

___

### rightOffset

• **rightOffset**: `number`

The margin space in bars from the right side of the chart.

___

### secondsVisible

• **secondsVisible**: `boolean`

Show seconds in the time scale and vertical crosshair label in `hh:mm:ss` format for intraday data.

___

### shiftVisibleRangeOnNewBar

• **shiftVisibleRangeOnNewBar**: `boolean`

Shift the visible range to the right (into the future) by the number of new bars when new data is added.

Note that this only applies when the last bar is visible.

___

### tickMarkFormatter

• `Optional` **tickMarkFormatter**: [`TickMarkFormatter`](../#tickmarkformatter)

Override the default tick marks formatter.

___

### timeVisible

• **timeVisible**: `boolean`

Show the time, not just the date, in the time scale and vertical crosshair label.

___

### visible

• **visible**: `boolean`

Show the time scale.
