---
sidebar_position: 0
sidebar_label: Pixel Perfect Rendering
pagination_title: Pixel Perfect Rendering
title: Best Practices for Pixel Perfect Rendering in Canvas Drawings
description: Best Practices for Pixel Perfect Rendering in Canvas Drawings when creating plugins for the Lightweight Charts
keywords:
  - plugins
  - extensions
  - rendering
  - canvas
  - bitmap
  - media
  - pixels
pagination_prev: null
---

To achieve crisp pixel perfect rendering for your plugins, it is recommended that the canvas drawings are created using bitmap coordinates. The difference between media and bitmap coordinate spaces is discussed on the [Canvas Rendering Target](../canvas-rendering-target.md) page. **Essentially, all drawing actions should use integer positions and dimensions when on the bitmap coordinate space.**

To ensure consistency between your plugins and the library's built-in logic for rendering points on the chart, use of the following calculation functions.

:::info

Variable names containing `media` refer to positions / dimensions specified using the media coordinate space (such as the x and y coordinates provided by the library to the renderers), and names containing `bitmap` refer to positions / dimensions on the bitmap coordinate space (actual device screen pixels).

:::

## Centered Shapes

If you need to draw a shape which is centred on a position (for example a price or x coordinate) and has a desired width then you could use the `positionsLine` function presented below. This can be used for drawing a horizontal line at a specific price, or a vertical line aligned with the centre of series point.

```typescript
interface BitmapPositionLength {
    /** coordinate for use with a bitmap rendering scope */
    position: number;
    /** length for use with a bitmap rendering scope */
    length: number;
}

function centreOffset(lineBitmapWidth: number): number {
    return Math.floor(lineBitmapWidth * 0.5);
}

/**
 * Calculates the bitmap position for an item with a desired length (height or width), and centred according to
 * a position coordinate defined in media sizing.
 * @param positionMedia - position coordinate for the bar (in media coordinates)
 * @param pixelRatio - pixel ratio. Either horizontal for x positions, or vertical for y positions
 * @param desiredWidthMedia - desired width (in media coordinates)
 * @returns Position of the start point and length dimension.
 */
export function positionsLine(
    positionMedia: number,
    pixelRatio: number,
    desiredWidthMedia: number = 1,
    widthIsBitmap?: boolean
): BitmapPositionLength {
    const scaledPosition = Math.round(pixelRatio * positionMedia);
    const lineBitmapWidth = widthIsBitmap
        ? desiredWidthMedia
        : Math.round(desiredWidthMedia * pixelRatio);
    const offset = centreOffset(lineBitmapWidth);
    const position = scaledPosition - offset;
    return { position, length: lineBitmapWidth };
}
```

## Dual Point Shapes

If you need to draw a shape between two coordinates (for example, y coordinates for a high and low price) then you can use the `positionsBox` function as presented below.

```typescript
/**
 * Determines the bitmap position and length for a dimension of a shape to be drawn.
 * @param position1Media - media coordinate for the first point
 * @param position2Media - media coordinate for the second point
 * @param pixelRatio - pixel ratio for the corresponding axis (vertical or horizontal)
 * @returns Position of the start point and length dimension.
 */
export function positionsBox(
    position1Media: number,
    position2Media: number,
    pixelRatio: number
): BitmapPositionLength {
    const scaledPosition1 = Math.round(pixelRatio * position1Media);
    const scaledPosition2 = Math.round(pixelRatio * position2Media);
    return {
        position: Math.min(scaledPosition1, scaledPosition2),
        length: Math.abs(scaledPosition2 - scaledPosition1) + 1,
    };
}
```

## Default Widths

Please refer to the following pages for functions defining the default widths of shapes drawn by the library:

- [Crosshair and Grid Lines](./widths/crosshair.md)
- [Candlesticks](./widths/candlestick.md)
- [Columns (Histogram)](./widths/columns.md)
- [Full Bar Width](./widths/full-bar-width.md)
