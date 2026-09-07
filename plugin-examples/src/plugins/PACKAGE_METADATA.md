# Package metadata for plugins

## accessibility

```json
{
    "description": "Drop-in accessibility layer built on pane primitives: adds semantic markup, keyboard navigation, and screen-reader support to help meet WCAG 2.1 AA.",
    "lwcPlugin": {
        "title": "Accessibility",
        "type": "pane-primitive",
        "categories": ["ux & accessibility"],
        "lifecycle": "current",
        "origin": "official",
        "author": "TradingView",
        "demo": "example/index.html",
        "tags": ["a11y", "accessibility", "wcag", "keyboard", "screen reader"]
    }
}
```

## brushable-area-series

```json
{
    "description": "Area series that can style ranges of data differently. Pair it with your own pointer handling to build a brush selection.",
    "lwcPlugin": {
        "title": "Brushable area series",
        "type": "custom-series",
        "categories": ["series types"],
        "lifecycle": "current",
        "origin": "official",
        "author": "TradingView",
        "demo": "example/index.html",
        "tags": ["brush", "selection", "area", "custom series"]
    }
}
```

## dual-range-histogram-series

```json
{
    "description": "Histogram with two nested value ranges above and below a baseline. A compact overlay for buy and sell volumes or net flows.",
    "lwcPlugin": {
        "title": "Dual range histogram series",
        "type": "custom-series",
        "categories": ["series types"],
        "lifecycle": "current",
        "origin": "official",
        "author": "TradingView",
        "demo": "example/index.html",
        "tags": ["histogram", "dual range", "baseline", "custom series"]
    }
}
```

## hlc-area-series

```json
{
    "description": "High-low-close series: fills the band between highs and lows and draws the close as a line on top.",
    "lwcPlugin": {
        "title": "HLC area series",
        "type": "custom-series",
        "categories": ["series types"],
        "lifecycle": "current",
        "origin": "official",
        "author": "TradingView",
        "demo": "example/index.html",
        "tags": ["hlc", "area", "band", "custom series"]
    }
}
```

## image-watermark

```json
{
    "description": "Image watermark drawn behind the attached series, centered and scaled to fit, with size limits, padding, and opacity controls.",
    "lwcPlugin": {
        "title": "Image watermark",
        "type": "series-primitive",
        "categories": ["overlays"],
        "lifecycle": "current",
        "origin": "official",
        "author": "TradingView",
        "demo": "example/index.html",
        "tags": ["watermark", "image", "branding", "overlay"]
    }
}
```

## pretty-histogram

```json
{
    "description": "Histogram with rounded, evenly spaced columns for a more polished look than the built-in histogram.",
    "lwcPlugin": {
        "title": "Pretty histogram series",
        "type": "custom-series",
        "categories": ["series types"],
        "lifecycle": "current",
        "origin": "official",
        "author": "TradingView",
        "demo": "example/index.html",
        "tags": ["histogram", "rounded", "custom series", "styling"]
    }
}
```

## rounded-candles-series

```json
{
    "description": "Candlestick series with rounded corners for a softer visual style. A drop-in replacement for the built-in candlestick series.",
    "lwcPlugin": {
        "title": "Rounded candles series",
        "type": "custom-series",
        "categories": ["series types"],
        "lifecycle": "current",
        "origin": "official",
        "author": "TradingView",
        "demo": "example/index.html",
        "tags": ["candlestick", "custom series", "rounded", "ohlc"]
    }
}
```

## stacked-area-series

```json
{
    "description": "Area series that stacks several values per time point into cumulative bands. Useful for composition-over-time views such as portfolio allocation.",
    "lwcPlugin": {
        "title": "Stacked area series",
        "type": "custom-series",
        "categories": ["series types"],
        "lifecycle": "current",
        "origin": "official",
        "author": "TradingView",
        "demo": "example/index.html",
        "tags": ["stacked", "area", "custom series", "composition"]
    }
}
```

## stacked-bars-series

```json
{
    "description": "Bar series that draws several values per time point as stacked segments summing to a total.",
    "lwcPlugin": {
        "title": "Stacked bars series",
        "type": "custom-series",
        "categories": ["series types"],
        "lifecycle": "current",
        "origin": "official",
        "author": "TradingView",
        "demo": "example/index.html",
        "tags": ["stacked", "bars", "custom series", "composition"]
    }
}
```

## vertical-line

```json
{
    "description": "Full-height vertical line at a given time, with an optional label on the time axis, for marking events, trades, and session boundaries.",
    "lwcPlugin": {
        "title": "Vertical line",
        "type": "series-primitive",
        "categories": ["drawing tools"],
        "lifecycle": "current",
        "origin": "official",
        "author": "TradingView",
        "demo": "example/index.html",
        "tags": ["vertical line", "drawing", "marker", "annotation"]
    }
}
```
