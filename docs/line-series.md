# Line

A line chart is a type of chart that displays information as series of the data points connected by straight line segments.

Line series has a crosshair marker - a round mark which is moving along the series' line while the cursor is moving along the time scale.

![Line chart example](./assets/line-series.png "Line chart example")

## How to create line series

```javascript
const lineSeries = chart.addLineSeries();

// set data
lineSeries.setData([
    { time: "2018-12-01", value: 32.51 },
    { time: "2018-12-02", value: 31.11 },
    { time: "2018-12-03", value: 27.02 },
    { time: "2018-12-04", value: 27.32 },
    { time: "2018-12-05", value: 25.17 },
    { time: "2018-12-06", value: 28.89 },
    { time: "2018-12-07", value: 25.46 },
    { time: "2018-12-08", value: 23.92 },
    { time: "2018-12-09", value: 22.68 },
    { time: "2018-12-10", value: 22.67 },
    { time: "2018-12-11", value: 27.57 },
    { time: "2018-12-12", value: 24.11 },
    { time: "2018-12-13", value: 30.74 },
]);
```

## Data format

Each item of the line series should include the following field:

- `time` ([Time](./time.md)) - a time of the item
- `value` (`number`) - a value of the item

## Customization

A line itself can be customized by setting its color, width and style.

Also, the crosshair marker which is enabled by default, can be either disabled or have its radius adjusted.

A line series interface can be customized using the following options:

|Name|Type|Default|Description|
|----|----|-------|-----------|
|`color`|`string`|`#2196f3`|Line color|
|`lineStyle`|[LineStyle](./constants.md#linestyle)|`LineStyle.Solid`|Line style|
|`lineWidth`|`number`|`3`|Line width (in pixels)|
|`crosshairMarkerVisible`|`boolean`|`true`|If `true`, the crosshair marker is shown on a chart|
|`crosshairMarkerRadius`|`number`|`4`|Crosshair marker radius (in pixels)|
|`lineType`|[LineType](./constants.md#linetype)|`LineType.Simple`|Line type|

### Examples

- set initial options for line series:

    ```javascript
    const lineSeries = chart.addLineSeries({
        color: '#f48fb1',
        lineStyle: 0,
        lineWidth: 1,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        lineType: 1,
    });
    ```

- change options after series is created:

    ```javascript
    // for example, let's override line width and color only
    lineSeries.applyOptions({
        color: 'rgba(255, 44, 128, 1)',
        lineWidth: 3,
    });
    ```

## What's next

- [Customization](./customization.md)
- [Constants](./constants.md)
- [Time](./time.md)
