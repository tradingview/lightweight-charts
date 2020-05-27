# Customization

## Initial chart options

Most of the chart settings can be set right when creating a chart. Subsequently, all of them may be changed using the `applyOptions` function.

### Size

First of all, the preferred chart size should be set when creating a chart:

```javascript
const chart = createChart(document.body, {
        width: 600,
        height: 380,
    },
});
```

If you want the chart size to be adjusted when the web page is resized, use the `resize` function to set the width and height of the chart:

```javascript
chart.resize(250, 150);
```

### Localization

Using the `localization` option you can set the displayed language, date and time formats.

#### Locale

By default, the library uses browser language settings.
Thus, the displayed date and time format may differ depending on the region of the user.
To set the same language settings for all users, use the `locale` property of the `localization` option:

```javascript
const chart = createChart(document.body, {
    localization: {
        locale: 'ja-JP',
    },
});
```

Using the `applyOptions` function you can change the locale at any time after the chart creation:

```javascript
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

```javascript
const chart = createChart(document.body, {
    localization: {
        dateFormat: 'yyyy/MM/dd',
    },
});
```

#### Time Format

`timeFormatter` function can be used to customize the format of the time stamp displayed on the time scale below the vertical crosshair line.

Changing the time format of the time scale labels is not available currently but we intend to roll this out in the future.

```javascript
const chart = createChart(document.body, {
    localization: {
        timeFormatter: function(businessDayOrTimestamp) {
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

```javascript
const chart = createChart(document.body, {
    localization: {
        priceFormatter: function(price) {
            // add $ sign before price

            return '$' + price;
        },
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
|`position`|`left` &#124; `right` &#124; `none`|`right`|Sets the position to display price scale|
|`mode`|[PriceScaleMode](./constants.md#pricescalemode) |`PriceScaleMode.Normal`|Sets the price scale mode|
|`autoScale`|`boolean`|`true`|If true, fits series data to a chart size|
|`invertScale`|`boolean`|`false`|If true, a chart series is reflected vertically, so that a growing trend is shown as a falling one and vice versa|
|`alignLabels`|`boolean`|`true`|If true, labels with price data do not overlap|
|`borderVisible`|`boolean`|`true`|If true, price scale border is visible|
|`borderColor`|`string`|`#2b2b43`|Pricescale border color|
|`scaleMargins`|`{ bottom, top }`|`{ bottom: 0.1, top: 0.2 }`|Sets the series margins from the top and bottom chart borders (percent)|
|`entireTextOnly`|`boolean`|`false`|If false, top and bottom corner labels are shown even if they are partially not visible |

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

## Crosshair

The crosshair shows the intersection of the price and time scale values at any point on the chart.

It is presented by horizontal and vertical lines. Each of them can be either customized by setting their `color`, `width` and `style` or disabled by using the `visible` option if necessary. Note that disabling crosshair lines does not disable crosshair marker on Line and Area series. It can be disabled by using the `crosshairMarkerVisible` option of relevant series.

Vertical and horizontal lines of the crosshair have marks on the price and the time scale. Any of those marks can be disabled.

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
|`labelBackgroundColor`|`string`|`#4c525e`|Crosshair label background color|
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

A grid is represented in chart background by vertical and horizontal lines drawn at the levels of visible marks of price and the time scale.
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
|`text`|`string`|`''`|Contains the text to be displayed in the watermark|
|`fontSize`|`number`|`48`|Watermark's font size in pixels|
|`horzAlign`|`left` &#124; `center` &#124; `right`|`center`|Watermark horizontal alignment position|
|`vertAlign`|`top` &#124; `center` &#124; `bottom`|`center`|Watermark vertical alignment position|

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
|`mouseWheel`|`boolean`|`true`|If true, chart scrolling with horizontal mouse wheel is enabled|
|`pressedMouseMove`|`boolean`|`true`|If true, chart scrolling with left mouse button pressed is allowed|
|`horzTouchDrag`|`boolean`|`true`|If true, the chart handles horizontal pointer movements on touch screens. In this case the webpage is not scrolled. If you set it to false, the webpage is scrolled instead. Keep in mind that if the user starts scrolling the chart vertically or horizontally, scrolling is continued in any direction until the user releases the finger|
|`vertTouchDrag`|`boolean`|`true`|If true, the chart handles vertical pointer movements on touch screens. In this case the webpage is not scrolled. If you set it to false, the webpage is scrolled instead. Keep in mind that if the user starts scrolling the chart vertically or horizontally, scrolling is continued in any direction until the user releases the finger.|

You can also set `handleScroll` to `true` or `false` to enable or disable all the above options.

### Scaling options

|Name                        |Type   |Default  |Description|
|----------------------------|-------|---------|-|
|`axisPressedMouseMove`|[`{ time, price }`](#axis-scaling-options)|`{ time: true, price: true }`|Sets time and price axis scaling with left mouse button pressed is allowed|
|`axisDoubleClickReset`|`boolean`|`true`|If true, left mouse button double click axis resetting is allowed|
|`mouseWheel`|`boolean`|`true`|If true, series scaling with a mouse wheel is enabled|
|`pinch`|`boolean`|`true`|If true, series scaling with pinch/zoom gestures (this option is supported on touch devices) is enabled|

You can also set `handleScale` to `true` or `false` to enable or disable all the above options.

## Axis scaling options

|Name                        |Type   |Default  |Description|
|----------------------------|-------|---------|-|
|`time`|`boolean`|`true`|If true, time axis scaling with left mouse button pressed is allowed|
|`price`|`boolean`|`true`|If true, price axis scaling with left mouse button pressed is allowed|

You can also set `axisPressedMouseMove` to `true` or `false` to enable or disable all the above options.

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

chart.applyOptions({
    handleScroll: true,
    handleScale: false,
});
```

## Next reading

- [Time Scale](./time-scale.md)
