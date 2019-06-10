# Bar series

A bar chart shows price movements in the form of bars.

Vertical line length of a bar is limited by the highest and lowest price values.

Open & Close values are represented by tick marks, on the left & right hand side of the bar respectively.

![Bar chart example](./assets/bar-series.png "Bar chart example")

## How to create bar series

```javascript
const barSeries = chart.addBarSeries({
    thinBars: false,
});

// set the data
barSeries.setData([
    { time: "2018-12-19", open: 141.77, high: 170.39, low: 120.25, close: 145.72 },
    { time: "2018-12-20", open: 145.72, high: 147.99, low: 100.11, close: 108.19 },
    { time: "2018-12-21", open: 108.19, high: 118.43, low: 74.22, close: 75.16 },
    { time: "2018-12-22", open: 75.16, high: 82.84, low: 36.16, close: 45.72 },
    { time: "2018-12-23", open: 45.12, high: 53.90, low: 45.12, close: 48.09 },
    { time: "2018-12-24", open: 60.71, high: 60.71, low: 53.39, close: 59.29 },
    { time: "2018-12-25", open: 68.26, high: 68.26, low: 59.04, close: 60.50 },
    { time: "2018-12-26", open: 67.71, high: 105.85, low: 66.67, close: 91.04 },
    { time: "2018-12-27", open: 91.04, high: 121.40, low: 82.70, close: 111.40 },
    { time: "2018-12-28", open: 111.51, high: 142.83, low: 103.34, close: 131.25 },
    { time: "2018-12-29", open: 131.33, high: 151.17, low: 77.68, close: 96.43 },
    { time: "2018-12-30", open: 106.33, high: 110.20, low: 90.39, close: 98.10 },
    { time: "2018-12-31", open: 109.87, high: 114.69, low: 85.66, close: 111.26 },
]);
```

## Data format

Each item of the bar series is [OHLC](./ohlc.md) item.

## Customization

By default, bars are displayed as thin sticks each being 1 px wide.
Bar width can be increased to 2 px by disabling the `thinBars` option.

Colors for rising & falling bars have to be set separately.

A bar series series interface can be customized using the following set of options:

|Name|Type|Default|Description|
|----|----|-------|-----------|
|`thinBars`|`boolean`|`true`|If true, bars are represented as sticks|
|`upColor`|`string`|`#26a69a`|Growing bar color|
|`downColor`|`string`|`#ef5350`|Falling bar color|
|`openVisible`|`boolean`|`true`|If true, then the open line of a bar is shown|

### Examples

- set initial options for bar series:

    ```javascript
    const barSeries = chart.addBarSeries({
        thinBars: false,
        upColor: 'rgba(37, 148, 51, 0.2)',
        downColor: 'rgba(191, 55, 48, 0.2)',
        openVisible: true,
    });
    ```

- change options after series is created:

    ```javascript
    // for example, let's disable thin bars and open price visibility
    barSeries.applyOptions({
        thinBars: false,
        openVisible: false,
    });
    ```

## What's next

- [Customization](./customization.md)
- [OHLC](./ohlc.md)
- [Time](./time.md)
