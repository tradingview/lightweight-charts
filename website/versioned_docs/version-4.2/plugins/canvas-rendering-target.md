---
sidebar_label: Canvas Rendering Target
sidebar_position: 3
---

# Canvas Rendering Target

The renderer functions used within the plugins (both Custom Series, and Drawing
Primitives) are provided with a `CanvasRenderingTarget2D` interface on which the
drawing logic (using the
[Browser's 2D Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D))
should be executed. `CanvasRenderingTarget2D` is provided by the
[Fancy Canvas](https://github.com/tradingview/fancy-canvas) library.

:::info

The typescript definitions can be viewed here:

- [fancy-canvas on npmjs.com](https://www.npmjs.com/package/fancy-canvas?activeTab=code)

and specifically the definition for `CanvasRenderingTarget2D` can be viewed
here:

- [canvas-rendering-target.d.ts](https://unpkg.com/fancy-canvas/canvas-rendering-target.d.ts)

:::

## Using `CanvasRenderingTarget2D`

`CanvasRenderingTarget2D` provides two rendering scope which you can use:

- `useMediaCoordinateSpace`
- `useBitmapCoordinateSpace`

## Difference between Bitmap and Media

Bitmap sizing represents the actual physical pixels on the device's screen,
while the media size represents the size of a pixel according to the operating
system (and browser) which is generally an integer representing the ratio of
actual physical pixels are used to render a media pixel. This integer ratio is
referred to as the device pixel ratio.

Using the bitmap sizing allows for more control over the drawn image to ensure
that the graphics are crisp and pixel perfect, however this generally means that
the code will contain a lot multiplication of coordinates by the pixel ratio. In
cases where you don't need to draw using the bitmap sizing then it is easier to
use media sizing as you don't need to worry about the devices pixel ratio.

### Bitmap Coordinate Space

`useBitmapCoordinateSpace` can be used to if you would like draw using the
actual devices pixels as the coordinate sizing. The provided scope (of type
`BitmapCoordinatesRenderingScope`) contains readonly values for the following:

- `context`
  ([CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)).
  Context which can be used for rendering.
- `horizontalPixelRatio` (number)
- `verticalPixelRatio` (number)
- `bitmapSize` (Size). Height and width of the canvas in bitmap dimensions.
- `mediaSize` (Size). Height and width of the canvas in media dimensions.

#### Bitmap Coordinate Space Usage

```js title='javascript'
// target is an instance of CanvasRenderingTarget2D
target.useBitmapCoordinateSpace(scope => {
    // scope is an instance of BitmapCoordinatesRenderingScope

    // example of drawing a filled rectangle which fills the canvas
    scope.context.beginPath();
    scope.context.rect(0, 0, scope.bitmapSize.width, scope.bitmapSize.height);
    scope.context.fillStyle = 'rgba(100, 200, 50, 0.5)';
    scope.context.fill();
});
```

### Media Coordinate Space

`useMediaCoordinateSpace` can be used to if you would like draw using the media
dimensions as the coordinate sizing. The provided scope (of type
`MediaCoordinatesRenderingScope`) contains readonly values for the following:

- `context`
  ([CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)).
  Context which can be used for rendering.
- `mediaSize` (Size). Height and width of the canvas in media dimensions.

#### Media Coordinate Space Usage

```js title='javascript'
// target is an instance of CanvasRenderingTarget2D
target.useMediaCoordinateSpace(scope => {
    // scope is an instance of BitmapCoordinatesRenderingScope

    // example of drawing a filled rectangle which fills the canvas
    scope.context.beginPath();
    scope.context.rect(0, 0, scope.mediaSize.width, scope.mediaSize.height);
    scope.context.fillStyle = 'rgba(100, 200, 50, 0.5)';
    scope.context.fill();
});
```

## General Tips

It is recommended that rendering functions should save and restore the canvas
context before and after all the rendering logic to ensure that the canvas state
is the same as when the renderer function was evoked. To handle the case
when an error in the code might prevent the restore function from being evoked,
you should use the try - finally code block to ensure that the context is
correctly restored in all cases.

**Note** that `useBitmapCoordinateSpace` and `useMediaCoordinateSpace` will automatically
save and restore the canvas context for the logic defined within them. This tip for your
additional rendering functions within the `use*CoordinateSpace`.

```js title='javascript'
function myRenderingFunction(scope) {
    const ctx = scope.context;

    // save the current state of the context to the stack
    ctx.save();

    try {
        // example code
        scope.context.beginPath();
        scope.context.rect(0, 0, scope.mediaSize.width, scope.mediaSize.height);
        scope.context.fillStyle = 'rgba(100, 200, 50, 0.5)';
        scope.context.fill();
    } finally {
        // restore the saved context from the stack
        ctx.restore();
    }
}

target.useMediaCoordinateSpace(scope => {
    myRenderingFunction(scope);
    myOtherRenderingFunction(scope);
    /* ... */
});
```
