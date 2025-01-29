---
sidebar_position: 0
sidebar_label: Full Bar Width
pagination_title: Full Bar Width
title: Full Bar Width Calculations
description: Describes the calculation for full bar widths
keywords:
  - plugins
  - extensions
  - rendering
  - canvas
  - bitmap
  - media
  - pixels
  - histogram
  - column
  - width
---

:::tip

It is recommend that you first read the [Pixel Perfect Rendering](../index.md) page.

:::

The following functions can be used to get the calculated width that the library would use for the full width of a bar (data point) at a specific bar spacing and device pixel ratio. This can be used when you would like to use the full width available for each data point on the x axis, and don't want any gaps to be visible.

```typescript
interface BitmapPositionLength {
    /** coordinate for use with a bitmap rendering scope */
    position: number;
    /** length for use with a bitmap rendering scope */
    length: number;
}

/**
 * Calculates the position and width which will completely full the space for the bar.
 * Useful if you want to draw something that will not have any gaps between surrounding bars.
 * @param xMedia - x coordinate of the bar defined in media sizing
 * @param halfBarSpacingMedia - half the width of the current barSpacing (un-rounded)
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns position and width which will completely full the space for the bar
 */
export function fullBarWidth(
    xMedia: number,
    halfBarSpacingMedia: number,
    horizontalPixelRatio: number
): BitmapPositionLength {
    const fullWidthLeftMedia = xMedia - halfBarSpacingMedia;
    const fullWidthRightMedia = xMedia + halfBarSpacingMedia;
    const fullWidthLeftBitmap = Math.round(
        fullWidthLeftMedia * horizontalPixelRatio
    );
    const fullWidthRightBitmap = Math.round(
        fullWidthRightMedia * horizontalPixelRatio
    );
    const fullWidthBitmap = fullWidthRightBitmap - fullWidthLeftBitmap;
    return {
        position: fullWidthLeftBitmap,
        length: fullWidthBitmap,
    };
}
```
