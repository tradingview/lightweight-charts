---
sidebar_position: 6
---

# Customization

## Initial chart options

Most of the chart settings can be set right when creating a chart. Subsequently, all of them may be changed using the `applyOptions` function.

### Size

First of all, the preferred chart size should be set when creating a chart:

```js
const chart = LightweightCharts.createChart(document.body, {
    width: 600,
    height: 380,
});
```

If you want the chart size to be adjusted when the web page is resized, use the `resize` function to set the width and height of the chart:

```js
chart.resize(250, 150);
```

### Localization

Using the `localization` option you can set the displayed language, date and time formats.

#### Locale

By default, the library uses browser language settings.
Thus, the displayed date and time format may differ depending on the region of the user.
To set the same language settings for all users, use the `locale` property of the `localization` option:

```js
const chart = LightweightCharts.createChart(document.body, {
    localization: {
        locale: 'ja-JP',
    },
});
```

Using the `applyOptions` function you can change the locale at any time after the chart creation:

```js
chart.applyOptions({
    localization: {
        locale: 'en-US',
    },
});
```

#### Date Format

Preferred date format can be set using the `dateFormat` property of the `localization` option.

The format string might contain "special" sequences, which will be replaced with corresponding date's value:

- `yyyy` - full year value (e.g. 2020)
- `yy` - short year value (e.g. 20)
- `MMMM` - long month value (e.g. July)
- `MMM` - short month value (e.g. Feb)
- `MM` - numeric (with leading zero if needed) month value (e.g. 03)
- `dd` - day of month (with leading zero if needed) value (e.g. 15)

```js
const chart = LightweightCharts.createChart(document.body, {
    localization: {
        dateFormat: 'yyyy/MM/dd',
    },
});
```

#### Time Format

`timeFormatter` function can be used to customize the format of the time stamp displayed on the time scale below the vertical crosshair line.

Changing the time format of the time scale labels is not available currently but we intend to roll this out in the future.

```js
const chart = LightweightCharts.createChart(document.body, {
    localization: {
        timeFormatter: businessDayOrTimestamp => {
            // console.log(businessDayOrTimestamp);

            if (LightweightCharts.isBusinessDay(businessDayOrTimestamp)) {
                return 'Format for business day';
            }

            return 'Format for timestamp';
        },
    },
});
```

#### Price Format

`priceFormatter` function can be used for the format customization of the price displayed on the price scale for crosshair value and labels.

```js
const chart = LightweightCharts.createChart(document.body, {
    localization: {
        priceFormatter: price =>
        // add $ sign before price

            '$' + price
        ,
    },
});
```

## Price Axis

Price axis is the vertical scale used for price value data.

Price scale has 4 data display modes:

- `Normal`
- `Logarithmic`
- `Percentage`
- `Indexed to 100`

The scale itself can be positioned either on the right/left side of a series. Use `position: none` if you don't want it to be visible on the chart.

The following set of options can be used to adjust the price axis interface: [PriceScaleOptions](/api/interfaces/PriceScaleOptions).

### An example of a price scale customization

```js
chart.applyOptions({
    priceScale: {
        position: 'left',
        mode: 2,
        autoScale: false,
        invertScale: true,
        alignLabels: false,
        borderVisible: false,
        borderColor: '#555ffd',
        scaleMargins: {
            top: 0.30,
            bottom: 0.25,
        },
    },
});
```

## Crosshair

The crosshair shows the intersection of the price and time scale values at any point on the chart.

It is presented by horizontal and vertical lines. Each of them can be either customized by setting their `color`, `width` and `style` or disabled by using the `visible` option if necessary. Note that disabling crosshair lines does not disable crosshair marker on Line and Area series. It can be disabled by using the `crosshairMarkerVisible` option of relevant series.

Vertical and horizontal lines of the crosshair have marks on the price and the time scale. Any of those marks can be disabled.

Crosshair has two moving modes:

- `Magnet` mode, which is enabled by default, sticks crosshair's horizontal line to the price value of Line and Area series or closing price marks of Bar and Candlestick series.
- `Normal` mode lets the crosshair move freely across the chart.

Note that crosshair lines have to be customized separately.

The following options are available for vertical and horizontal lines of a crosshair: [CrosshairOptions](/api/interfaces/CrosshairOptions).

### An example of a crosshair customization

```js
chart.applyOptions({
    crosshair: {
        vertLine: {
            color: '#6A5ACD',
            width: 0.5,
            style: 1,
            visible: true,
            labelVisible: false,
        },
        horzLine: {
            color: '#6A5ACD',
            width: 0.5,
            style: 0,
            visible: true,
            labelVisible: true,
        },
        mode: 1,
    },
});
```

## Grid

A grid is represented in chart background by vertical and horizontal lines drawn at the levels of visible marks of price and the time scale.
It is possible to set a custom `color` and `style` for grid lines or disable their visibility if necessary.
Note that vertical and horizontal lines of a grid have to be customized separately.

The following options are available for vertical and horizontal lines of a grid: [GridOptions](/api/interfaces/GridOptions).

### An example of a grid customization

```js
chart.applyOptions({
    grid: {
        vertLines: {
            color: 'rgba(70, 130, 180, 0.5)',
            style: 1,
            visible: true,
        },
        horzLines: {
            color: 'rgba(70, 130, 180, 0.5)',
            style: 1,
            visible: true,
        },
    },
});
```

## Watermark

A watermark is a background label that includes a brief description of the drawn data. Any text can be added to it.
A display of a watermark is disabled by default.
Please make sure you enable it and set an appropriate font color and size to make your watermark visible in the background of the chart.
We recommend a semi-transparent color and a large font.
Also note that watermark position can be aligned vertically and horizontally.

The following options are available for the watermark: [WatermarkOptions](/api/interfaces/WatermarkOptions).

### An example of a watermark customization

```js
chart.applyOptions({
    watermark: {
        color: 'rgba(11, 94, 29, 0.4)',
        visible: true,
        text: 'TradingView Watermark Example',
        fontSize: 24,
        horzAlign: 'left',
        vertAlign: 'bottom',
    },
});
```

## Chart layout options

The following options can be used to customize chart design: [LayoutOptions](/api/interfaces/LayoutOptions).

### Background

Background can be either solid or vertical gradient.

Solid background has two fields:

- `type` - always `ColorType.Solid`.
- `color` - solid color.

Vertical gradient background has three fields:

- `type` - always `ColorType.VerticalGradient`.
- `topColor` - gradient top color.
- `bottomColor` - gradient bottom color.

### An example of layout customization

```js
chart.applyOptions({
    layout: {
        background: {
            type: LightweightCharts.ColorType.VerticalGradient,
            topColor: '#FFFFFF',
            bottomColor: '#AAFFAA',
        },
        textColor: '#696969',
        fontSize: 12,
        fontFamily: 'Calibri',
    },
});
```

## Scrolling and scaling options

The following scrolling and scaling modes on series and scales are enabled by default.
You can disable any of them using `handleScroll` and `handleScale` options.

### Scrolling options

See [HandleScrollOptions](/api/interfaces/HandleScrollOptions).

### Kinetic scroll options

You can disable or enable kinetic scroll via mouse or via touch gestures separately using `kineticScroll` options.

See [KineticScrollOptions](/api/interfaces/KineticScrollOptions).

### Scaling options

See [HandleScaleOptions](/api/interfaces/HandleScaleOptions).

## Axis scaling options

See [AxisPressedMouseMoveOptions](/api/interfaces/AxisPressedMouseMoveOptions).

## An example of a scrolling/scaling customization

```js
chart.applyOptions({
    handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
    },
    handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
    },
});

chart.applyOptions({
    handleScroll: true,
    handleScale: false,
});
```
