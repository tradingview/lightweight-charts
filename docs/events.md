# Events

Event subscriptions can notify you of such chart/user interactions as mouse clicks/moving of mouse cursor.

## Click

|Name|Description|
|-|-|
|`subscribeClick(handler: MouseEventHandler): void;`|Get notified when a mouse clicks on a chart|
|`unsubscribeClick(handler: MouseEventHandler): void;`|Don’t get notified when a mouse clicks on a chart|

Example:

```javascript
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

|Name|Description|
|-|-|
|`subscribeCrosshairMove(handler: MouseEventHandler): void;`|Get notified when a mouse moves on a chart|
|`unsubscribeCrosshairMove(handler: MouseEventHandler): void;`|Don’t get notified when a mouse moves on a chart|

Example:

```javascript
function handleCrosshairMoved(param) {
    if (!param.point) {
        return;
    }

    console.log(`A user moved the crosshair to (${param.point.x}, ${param.point.y}) point, the time is ${param.time}`);
}

chart.subscribeCrosshairMove(handleClick);

// ... after some time

chart.unsubscribeCrosshairMove(handleClick);
```

## Types

### MouseEventHandler

MouseEventHandler is a type of callback that is used in the subscription methods.

```typescript
export type MouseEventHandler = (param: MouseEventParams) => void;
```

`MouseEventParams` is an object with the following fields:

- `time` (`Time`, optional) - time
- `point`: (`{ x: number, y: number }`, optional) - coordinate
- `seriesPrices`: (`Map<ISeriesApi, number>`) - series prices

`time` is not defined if an event was fired outside of data range (e.g. right/left of all data points).

`point` is not defined if an event was fired outside of the chart (for example on a mouse leave event).

`seriesPrices` contains all series prices according to the event point details.
