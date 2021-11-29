---
sidebar_position: 4
---

# Events

Event subscriptions can notify you of such chart/user interactions as mouse clicks/moving of mouse cursor and changes of the chart visible time range.

## Click

See [subscribeClick](/api/interfaces/IChartApi#subscribeclick) and [unsubscribeClick](/api/interfaces/IChartApi#unsubscribeclick).

Example:

```js
function handleClick(param) {
    if (!param.point) {
        return;
    }

    console.log(`An user clicks at (${param.point.x}, ${param.point.y}) point, the time is ${param.time}`);
}

chart.subscribeClick(handleClick);

// ... after some time

chart.unsubscribeClick(handleClick);
```

## Crosshair move

See [subscribeCrosshairMove](/api/interfaces/IChartApi#subscribecrosshairmove) and [unsubscribeCrosshairMove](/api/interfaces/IChartApi#unsubscribecrosshairmove).

Example:

```js
function handleCrosshairMoved(param) {
    if (!param.point) {
        return;
    }

    console.log(`A user moved the crosshair to (${param.point.x}, ${param.point.y}) point, the time is ${param.time}`);
}

chart.subscribeCrosshairMove(handleCrosshairMoved);

// ... after some time

chart.unsubscribeCrosshairMove(handleCrosshairMoved);
```
