---
sidebar_position: 0
sidebar_label: Crosshair
pagination_title: Crosshair Widths
title: Crosshair and Grid Line Width Calculations
description: Describes the calculation for the crosshair line and grid line widths
keywords:
  - plugins
  - extensions
  - rendering
  - canvas
  - bitmap
  - media
  - pixels
  - crosshair
  - grid
  - line
  - width
---

:::tip

It is recommend that you first read the [Pixel Perfect Rendering](../index.md) page.

:::

The following functions can be used to get the calculated width that the library would use for a crosshair or grid line at a specific device pixel ratio.

```typescript
/**
 * Default grid / crosshair line width in Bitmap sizing
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns default grid / crosshair line width in Bitmap sizing
 */
export function gridAndCrosshairBitmapWidth(
    horizontalPixelRatio: number
): number {
    return Math.max(1, Math.floor(horizontalPixelRatio));
}

/**
 * Default grid / crosshair line width in Media sizing
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns default grid / crosshair line width in Media sizing
 */
export function gridAndCrosshairMediaWidth(
    horizontalPixelRatio: number
): number {
    return (
        gridAndCrosshairBitmapWidth(horizontalPixelRatio) / horizontalPixelRatio
    );
}

```
