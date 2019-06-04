# Customization

## Initial chart options

Firstly, a preferred size needs to be set when creating a chart.

Also, the `localization` option may help you set a suitable date format and user language.
The following date formats are available:

- `dd MMM 'yy` - `25 Jun '18` _(default)_
- `yyyy-MM-dd` - `2018-06-25`
- `yy-MM-dd` - `18-06-25`
- `yy/MM/dd` - `18/06/25`
- `yyyy/MM/dd` - `2018/06/25`
- `dd-MM-yyyy` - `25-06-2018`
- `dd-MM-yy` - `25-06-18`
- `dd/MM/yy` - `25/06/18`
- `dd/MM/yyyy` - `25/06/2018`
- `MM/dd/yy` - `06/25/18`
- `MM/dd/yyyy` - `06/25/2018`

Default user language is the same as browser language and can be changed using the `locale` property of the  `localization` option.

### An example of chart creation

```javascript
const chart = createChart(document.body, {
    width: 600,
    height: 380,
    localization: {
        dateFormat: 'yyyy/MM/dd',
        locale: 'ja-JP',
    },
});
```

Once a chart has been created, there is a possibility to resize it or customize its appearance and behavior by calling `applyOptions`:

```javascript
chart.applyOptions({
    width: 250,
    height: 150,
    localization: {
        dateFormat: 'MM/dd/yy',
        locale: 'en-US',
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

The following set of options can be used to adjust the price axis interface:

|Name|Type|Default|Description|
|--|---|-|--|
|`position`|`string`|`right`|Sets the position to display price scale. Options available: `left`, `right`, `none`|
|`mode`|[PriceScaleMode](./constants.md#pricescalemode) |`PriceScaleMode.Normal`|Sets the price scale mode|
|`autoScale`|`boolean`|`true`|If true, fits series data to a chart size|
|`invertScale`|`boolean`|`false`|If true, a chart series is reflected vertically, so that a growing trend is shown as a falling one and vise versa|
|`alignLabels`|`boolean`|`true`|If true, labels with price data do not overlap|
|`borderVisible`|`boolean`|`true`|If true, price scale border is visible|
|`borderColor`|`string`|`#2b2b43`|Pricescale border color|
|`scaleMargins`|`object`|`{ bottom: 0.1, top: 0.2 }`|Sets the series margins from the top and bottom chart borders (per cent)|

### An example of a price scale customization

```javascript
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

## Time Axis

Time axis is a horizontal scale at the bottom of the chart, used to display different time units.

Time scale options enable adjusting of series that are displayed on a chart when scaling and resizing a chart.

Time scale can be hidden if needed.

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
    },
});
```

## Crosshair

Crosshair shows an intersection of a price and time axis values on any hovered point of on the chart.

It is presented by horizontal and vertical lines. Each of them can be either customized by setting their `color`, `width` and `style` or disabled by using the `visible` option if necessary. Note that disabling crosshair lines does not disable crosshair marker on Line and Area series. It can be disabled by using the `crosshairMarkerVisible` option of relevant series.

Vertical and horizontal lines of the crosshair have marks on the price and time axis. Any of those marks can be disabled.

Crosshair has two moving modes:

- `Magnet` mode, which is enabled by default, sticks crosshair's horizontal line to the price value of Line and Area series or closing price marks of Bar and Candlestick series.
- `Normal` mode lets the crosshair move freely across the chart.

Note that crosshair lines have to be customized separately.

The following options are available for vertical and horizontal lines of a crosshair:

|Name                        |Type   |Default |Description|
|----------------------------|-------|--------|-|
|`color`|`string`|`#758696`|Crosshair line color|
|`width`|`number`|`1`|Crosshair line width in pixels|
|`style`|[LineStyle](./constants.md#linestyle)|`LineStyle.Dashed`|Crosshair line style|
|`visible`|`boolean`|`true`|If true, crosshair line is displayed on a chart|
|`labelVisible`|`boolean`|`true`|If true, a data label is shown on a relevant scale|
|`mode`|[CrosshairMode](./constants.md#crosshairmode)|`CrosshairMode.Magnet`|Sets the mode of crosshair moving.|

### An example of a crosshair customization

```javascript
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

A grid is represented in chart background by vertical and horizontal lines drawn at the levels of visible marks of price and time axis.
It is possible to set a custom `color` and `style` for grid lines or disable their visibility if necessary.
Note that vertical and horizontal lines of a grid have to be customized separately.

The following options are available for vertical and horizontal lines of a grid:

|Name|Type|Default  |Description|
|-|-|-|-|
|`color`|`string`|`#d6dcde`|Grid lines color|
|`style`|[LineStyle](./constants.md#linestyle)|`LineStyle.Solid`|Grid lines style|
|`visible`|`boolean`|`true`|If true, grid lines are displayed on a chart|

### An example of a grid customization

```javascript
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

The following options are available for the watermark:

|Name                        |Type   |Default  |Description|
|----------------------------|-------|---------|-|
|`color`|`string`|`rgba(0, 0, 0, 0)`|Watermark color|
|`visible`|`boolean`|`false`|If true, the watermark is displayed on a chart|
|`text`|`string`|''|Contains the text to be displayed in the watermark|
|`fontSize`|`number`|`48`|Watermark's font size in pixels|
|`horzAlign`|`string`|`center`|Watermark horizontal alignment position. Available options : 'left', 'center', 'right'|
|`vertAlign`|`string`|`center`|Watermark vertical alignment position. Available options: 'top', 'center', 'bottom'|

### An example of a watermark customization

```javascript
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

The following options can be used to customize chart design:

|Name                        |Type   |Default  |Description|
|----------------------------|-------|---------|-|
|`backgroundColor`|`string`|`#ffffff`|Chart and scale background color|
|`textColor`|`string`|`#191919`|Scale value text color|
|`fontSize`|`number`|`11`|Scales values' font size|
|`fontFamily`|`string`|`'Trebuchet MS', Roboto, Ubuntu, sans-serif`|Font family to be used on scales|

### An example of layout customization

```javascript
chart.applyOptions({
    layout: {
        backgroundColor: '#FAEBD7',
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

|Name                        |Type   |Default  |Description|
|----------------------------|-------|---------|-|
|`mouseWheel`|`boolean`|`true`|If true series scrolling with horizontal mouse wheel is enabled|
|`pressedMouseMove`|`boolean`|`true`|If true series scrolling with left mouse button pressed is allowed|

### Scaling options

|Name                        |Type   |Default  |Description|
|----------------------------|-------|---------|-|
|`axisPressedMouseMove`|`boolean`|`true`|If true axis scaling with left mouse button pressed is allowed|
|`mouseWheel`|`boolean`|`true`|If true series scaling with mouse whee is enabled|
|`pinch`|`boolean`|`true`|If true series scaling with pinch/zoom gestures (this option is supported on touch devices) is enabled|

### An example of a scrolling/scaling customization

```javascript
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
```

## Branding

You may hide our branding if you feel that it harms user experience on your website.
Note that according to our terms you should add a link leading to <https://www.tradingview.com/> somewhere on your web page.
This link must contain the text from the NOTICE file which is a part of the product package.
Please see `disableBranding` method below.

```javascript
chart.disableBranding();
```
