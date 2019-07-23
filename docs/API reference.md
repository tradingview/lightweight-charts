# API Reference

## Timescale API

### scrollPosition()

Returns a distance from the right edge to the latest bar, measured in bars.

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
