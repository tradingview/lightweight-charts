# Time Axis

Time axis (timescale) is a horizontal scale at the bottom of the chart, used to display different time units.

## Timescale options

Timescale options enable adjusting of series that are displayed on a chart when scaling and resizing a chart.

Timescale can be hidden if needed.

The following options are available in the time axis interface:

|Name|Type|Default|Description|
|----------------------------|-------|-------|--|
|`rightOffset`|`number`|`0`|Sets the margin space in bars from the right side of the chart|
|`barSpacing`|`number`|`6`|Sets the space between bars in pixels|
|`fixLeftEdge`|`boolean`|`false`|If true, prevents scrolling to the left of the first historical bar|
|`lockVisibleTimeRangeOnResize`|`boolean`|`false`|If true, prevents changing visible time area during chart resizing|
|`rightBarStaysOnScroll`|`boolean`|`false`|If false, the hovered bar remains in the same place when scrolling|
|`borderVisible`|`boolean`|`true`|If true, timescale border is visible|
|`borderColor`|`string`|`#2b2b43`|Timescale border color|
|`visible`|`boolean`|`true`|If true, timescale is shown on a chart|
|`timeVisible`|`boolean`|`false`|If true, time is shown on the time scale and crosshair vertical label|
|`secondsVisible`|`boolean`|`true`|If true, seconds are shown on the label of the crosshair vertical line in `hh:mm:ss` format on intraday intervals|

### Example of timescale customization

```javascript
chart.applyOptions({
    timeScale: {
        rightOffset: 12,
        barSpacing: 3,
        fixLeftEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        borderVisible: false,
        borderColor: '#fff000',
        visible: true,
        timeVisible: true,
        secondsVisible: false,
    },
});
```

## Timescale API

### scrollPosition()

Returns a distance from the right edge of the timescale to the latest bar of series, measured in bars.

```javascript
chart.timeScale().scrollPosition();
```

### scrollToPosition()

Scrolls a series to the specified position. Argumens are:

`position` - number of target data position

`animated` - if true, makes the series scrolling smoothly and adds animation

```javascript
chart.timeScale().scrollToPosition(2, true);
```

### scrollToRealTime()

Restores default scroll position of the chart. This process is always animated.

```javascript
chart.timeScale().scrollToRealTime();
```

### getVisibleRange()

Returns current visible time range of a chart in the form of an object with the first and the last time points of a timerange, or returns null if the chart has no data at all.

```javascript
chart.timeScale().getVisibleRange();
```

### setVisibleRange()

Sets visible range of data. Argument is an object with the first and the last time points of a timerange desired.

```javascript
chart.timeScale().setVisibleRange({
    from: (new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0))).getTime() / 1000,
    to: (new Date(Date.UTC(2018, 1, 1, 0, 0, 0, 0))).getTime() / 1000,
 });
```

### resetTimeScale()

Restores default zooming and scroll position of the time scale.

```javascript
chart.timeScale().resetTimeScale();
```

### fitContent()

Automatically calculates the visible range to fit all data from all series.

```javascript
chart.timeScale().fitContent();
```

### applyOptions()

Applies new options to the time scale. Argument is an object with a set of options.

```javascript
chart.timeScale().applyOptions({
    rightOffset:12,
    borderVisible: false,
    });
```

### options()

Returns an object with the set of options currently applied to the timescale.

```javascript
chart.timeScale().options();
```
