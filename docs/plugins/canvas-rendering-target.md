# Canvas rendering target

The renderer functions of a plugin — whether it is a custom series or a
primitive — receive a `CanvasRenderingTarget2D` target to execute their
drawing logic on, using the browser's
[2D Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D).
`CanvasRenderingTarget2D` comes from the
[Fancy Canvas](https://github.com/tradingview/fancy-canvas) library; its
definition can be viewed in
[canvas-rendering-target.d.ts](https://unpkg.com/fancy-canvas/canvas-rendering-target.d.ts)
within the published
[TypeScript declarations](https://www.npmjs.com/package/fancy-canvas?activeTab=code).

## Using CanvasRenderingTarget2D

`CanvasRenderingTarget2D` provides two rendering scopes which you can use:

- `useMediaCoordinateSpace`
- `useBitmapCoordinateSpace`

## Difference between bitmap and media

Bitmap sizing represents the actual physical pixels on the device's screen,
while media sizing represents the size of a pixel as seen by the operating
system and the browser. The number of physical pixels used to render one media
pixel is referred to as the device pixel ratio.

Bitmap sizing gives you more control over the drawn image and lets you keep
the graphics crisp and pixel perfect; the cost is that the code multiplies
coordinates by the pixel ratio throughout. When you don't need that precision,
media sizing is easier: you don't have to think about the device pixel ratio
at all.

### Bitmap coordinate space

Use `useBitmapCoordinateSpace` to draw with the actual device pixels as the
coordinate sizing. The provided scope (of type
`BitmapCoordinatesRenderingScope`) contains readonly values for the following:

- `context`
  ([CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)).
  Context which can be used for rendering.
- `horizontalPixelRatio` (number)
- `verticalPixelRatio` (number)
- `bitmapSize` (Size). Height and width of the canvas in bitmap dimensions.
- `mediaSize` (Size). Height and width of the canvas in media dimensions.

#### Bitmap coordinate space usage

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

### Media coordinate space

Use `useMediaCoordinateSpace` to draw with the media dimensions as the
coordinate sizing. The provided scope (of type
`MediaCoordinatesRenderingScope`) contains readonly values for the following:

- `context`
  ([CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)).
  Context which can be used for rendering.
- `mediaSize` (Size). Height and width of the canvas in media dimensions.

#### Media coordinate space usage

```js title='javascript'
// target is an instance of CanvasRenderingTarget2D
target.useMediaCoordinateSpace(scope => {
    // scope is an instance of MediaCoordinatesRenderingScope

    // example of drawing a filled rectangle which fills the canvas
    scope.context.beginPath();
    scope.context.rect(0, 0, scope.mediaSize.width, scope.mediaSize.height);
    scope.context.fillStyle = 'rgba(100, 200, 50, 0.5)';
    scope.context.fill();
});
```

## General tips

It is recommended that rendering functions save and restore the canvas context
before and after all their rendering logic, so the canvas state is the same as
when the function was called. Wrap the logic in a `try…finally` block so the
context is restored even when an error interrupts the drawing.

**Note** that `useBitmapCoordinateSpace` and `useMediaCoordinateSpace`
automatically save and restore the canvas context for the logic defined within
them. This tip applies to your additional rendering functions called inside
`use*CoordinateSpace`.

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

---

Documentation for Lightweight Charts™ v5.2 (latest released version).

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
