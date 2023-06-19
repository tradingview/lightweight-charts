---
sidebar_position: 0
sidebar_label: Candlesticks
pagination_title: Candlestick Widths
title: Candlestick Width Calculations
description: Describes the calculation for candlestick body widths
keywords:
  - plugins
  - extensions
  - rendering
  - canvas
  - bitmap
  - media
  - pixels
  - candlestick
  - width
---

:::tip

It is recommend that you first read the [Pixel Perfect Rendering](../index.md) page.

:::

The following functions can be used to get the calculated width that the library would use for a candlestick at a specific bar spacing and device pixel ratio.

Below a bar spacing of 4, the library will attempt to use as large a width as possible without the possibility of overlapping, whilst above 4 then the width will start to trend towards an 80% width of the available space.

:::warning

It is expected that candles can overlap slightly at smaller bar spacings (more pronounced on lower resolution devices). This produces a more readable chart. If you need to ensure that bars can never overlap then rather use the widths for [Columns](./columns.md) or the [full bar width](./full-bar-width.md) calculation.

:::

```typescript
function optimalCandlestickWidth(
    barSpacing: number,
    pixelRatio: number
): number {
    const barSpacingSpecialCaseFrom = 2.5;
    const barSpacingSpecialCaseTo = 4;
    const barSpacingSpecialCaseCoeff = 3;
    if (barSpacing >= barSpacingSpecialCaseFrom && barSpacing <= barSpacingSpecialCaseTo) {
        return Math.floor(barSpacingSpecialCaseCoeff * pixelRatio);
    }
    // coeff should be 1 on small barspacing and go to 0.8 while bar spacing grows
    const barSpacingReducingCoeff = 0.2;
    const coeff =
        1 -
        (barSpacingReducingCoeff *
            Math.atan(
                Math.max(barSpacingSpecialCaseTo, barSpacing) - barSpacingSpecialCaseTo
            )) /
            (Math.PI * 0.5);
    const res = Math.floor(barSpacing * coeff * pixelRatio);
    const scaledBarSpacing = Math.floor(barSpacing * pixelRatio);
    const optimal = Math.min(res, scaledBarSpacing);
    return Math.max(Math.floor(pixelRatio), optimal);
}

/**
 * Calculates the candlestick width that the library would use for the current
 * bar spacing.
 * @param barSpacing bar spacing in media coordinates
 * @param horizontalPixelRatio - horizontal pixel ratio
 * @returns The width (in bitmap coordinates) that the chart would use to draw a candle body
 */
export function candlestickWidth(
    barSpacing: number,
    horizontalPixelRatio: number
): number {
    let width = optimalCandlestickWidth(barSpacing, horizontalPixelRatio);
    if (width >= 2) {
        const wickWidth = Math.floor(horizontalPixelRatio);
        if (wickWidth % 2 !== width % 2) {
            width--;
        }
    }
    return width;
}
```
