/*!
 * @license
 * TradingView Lightweight Charts™ v5.0.3-dev+202502271113
 * Copyright (c) 2025 TradingView, Inc.
 * Licensed under Apache License 2.0 https://www.apache.org/licenses/LICENSE-2.0
 */
const customStyleDefaults$1 = {
    color: '#2196f3',
};
const seriesOptionsDefaults = {
    title: '',
    visible: true,
    lastValueVisible: true,
    priceLineVisible: true,
    priceLineSource: 0 /* PriceLineSource.LastBar */,
    priceLineWidth: 1,
    priceLineColor: '',
    priceLineStyle: 2 /* LineStyle.Dashed */,
    baseLineVisible: true,
    baseLineWidth: 1,
    baseLineColor: '#B2B5BE',
    baseLineStyle: 0 /* LineStyle.Solid */,
    priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
    },
};

/**
 * Represents the possible line types.
 */
var LineType;
(function (LineType) {
    /**
     * A line.
     */
    LineType[LineType["Simple"] = 0] = "Simple";
    /**
     * A stepped line.
     */
    LineType[LineType["WithSteps"] = 1] = "WithSteps";
    /**
     * A curved line.
     */
    LineType[LineType["Curved"] = 2] = "Curved";
})(LineType || (LineType = {}));
/**
 * Represents the possible line styles.
 */
var LineStyle;
(function (LineStyle) {
    /**
     * A solid line.
     */
    LineStyle[LineStyle["Solid"] = 0] = "Solid";
    /**
     * A dotted line.
     */
    LineStyle[LineStyle["Dotted"] = 1] = "Dotted";
    /**
     * A dashed line.
     */
    LineStyle[LineStyle["Dashed"] = 2] = "Dashed";
    /**
     * A dashed line with bigger dashes.
     */
    LineStyle[LineStyle["LargeDashed"] = 3] = "LargeDashed";
    /**
     * A dotted line with more space between dots.
     */
    LineStyle[LineStyle["SparseDotted"] = 4] = "SparseDotted";
})(LineStyle || (LineStyle = {}));
function setLineStyle(ctx, style) {
    const dashPatterns = {
        [0 /* LineStyle.Solid */]: [],
        [1 /* LineStyle.Dotted */]: [ctx.lineWidth, ctx.lineWidth],
        [2 /* LineStyle.Dashed */]: [2 * ctx.lineWidth, 2 * ctx.lineWidth],
        [3 /* LineStyle.LargeDashed */]: [6 * ctx.lineWidth, 6 * ctx.lineWidth],
        [4 /* LineStyle.SparseDotted */]: [ctx.lineWidth, 4 * ctx.lineWidth],
    };
    const dashPattern = dashPatterns[style];
    ctx.setLineDash(dashPattern);
}
function drawHorizontalLine(ctx, y, left, right) {
    ctx.beginPath();
    const correction = (ctx.lineWidth % 2) ? 0.5 : 0;
    ctx.moveTo(left, y + correction);
    ctx.lineTo(right, y + correction);
    ctx.stroke();
}
function drawVerticalLine(ctx, x, top, bottom) {
    ctx.beginPath();
    const correction = (ctx.lineWidth % 2) ? 0.5 : 0;
    ctx.moveTo(x + correction, top);
    ctx.lineTo(x + correction, bottom);
    ctx.stroke();
}
function strokeInPixel(ctx, drawFunction) {
    ctx.save();
    if (ctx.lineWidth % 2) {
        ctx.translate(0.5, 0.5);
    }
    drawFunction();
    ctx.restore();
}

/**
 * Checks an assertion. Throws if the assertion is failed.
 *
 * @param condition - Result of the assertion evaluation
 * @param message - Text to include in the exception message
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error('Assertion failed' + (message ? ': ' + message : ''));
    }
}
function ensureDefined(value) {
    if (value === undefined) {
        throw new Error('Value is undefined');
    }
    return value;
}
function ensureNotNull(value) {
    if (value === null) {
        throw new Error('Value is null');
    }
    return value;
}
function ensure(value) {
    return ensureNotNull(ensureDefined(value));
}

class Delegate {
    constructor() {
        this._private__listeners = [];
    }
    _internal_subscribe(callback, linkedObject, singleshot) {
        const listener = {
            _internal_callback: callback,
            _internal_linkedObject: linkedObject,
            _internal_singleshot: singleshot === true,
        };
        this._private__listeners.push(listener);
    }
    _internal_unsubscribe(callback) {
        const index = this._private__listeners.findIndex((listener) => callback === listener._internal_callback);
        if (index > -1) {
            this._private__listeners.splice(index, 1);
        }
    }
    _internal_unsubscribeAll(linkedObject) {
        this._private__listeners = this._private__listeners.filter((listener) => listener._internal_linkedObject !== linkedObject);
    }
    _internal_fire(param1, param2, param3) {
        const listenersSnapshot = [...this._private__listeners];
        this._private__listeners = this._private__listeners.filter((listener) => !listener._internal_singleshot);
        listenersSnapshot.forEach((listener) => listener._internal_callback(param1, param2, param3));
    }
    _internal_hasListeners() {
        return this._private__listeners.length > 0;
    }
    _internal_destroy() {
        this._private__listeners = [];
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function merge(dst, ...sources) {
    for (const src of sources) {
        // eslint-disable-next-line no-restricted-syntax
        for (const i in src) {
            if (src[i] === undefined ||
                !Object.prototype.hasOwnProperty.call(src, i) ||
                ['__proto__', 'constructor', 'prototype'].includes(i)) {
                continue;
            }
            if ('object' !== typeof src[i] || dst[i] === undefined || Array.isArray(src[i])) {
                dst[i] = src[i];
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                merge(dst[i], src[i]);
            }
        }
    }
    return dst;
}
function isNumber(value) {
    return (typeof value === 'number') && (isFinite(value));
}
function isInteger(value) {
    return (typeof value === 'number') && ((value % 1) === 0);
}
function isString(value) {
    return typeof value === 'string';
}
function isBoolean(value) {
    return typeof value === 'boolean';
}
function clone(object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = object;
    if (!o || 'object' !== typeof o) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return o;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let c;
    if (Array.isArray(o)) {
        c = [];
    }
    else {
        c = {};
    }
    let p;
    let v;
    // eslint-disable-next-line no-restricted-syntax
    for (p in o) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,no-prototype-builtins
        if (o.hasOwnProperty(p)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            v = o[p];
            if (v && 'object' === typeof v) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                c[p] = clone(v);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                c[p] = v;
            }
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return c;
}
function notNull(t) {
    return t !== null;
}
function undefinedIfNull(t) {
    return (t === null) ? undefined : t;
}

/**
 * Default font family.
 * Must be used to generate font string when font is not specified.
 */
const defaultFontFamily = `-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif`;
/**
 * Generates a font string, which can be used to set in canvas' font property.
 * If no family provided, {@link defaultFontFamily} will be used.
 *
 * @param size - Font size in pixels.
 * @param family - Optional font family.
 * @param style - Optional font style.
 * @returns The font string.
 */
function makeFont(size, family, style) {
    if (style !== undefined) {
        style = `${style} `;
    }
    else {
        style = '';
    }
    if (family === undefined) {
        family = defaultFontFamily;
    }
    return `${style}${size}px ${family}`;
}

class PriceAxisRendererOptionsProvider {
    constructor(chartModel) {
        this._private__rendererOptions = {
            _internal_borderSize: 1 /* RendererConstants.BorderSize */,
            _internal_tickLength: 5 /* RendererConstants.TickLength */,
            _internal_fontSize: NaN,
            _internal_font: '',
            _internal_fontFamily: '',
            _internal_color: '',
            _internal_paneBackgroundColor: '',
            _internal_paddingBottom: 0,
            _internal_paddingInner: 0,
            _internal_paddingOuter: 0,
            _internal_paddingTop: 0,
            _internal_baselineOffset: 0,
        };
        this._private__chartModel = chartModel;
    }
    _internal_options() {
        const rendererOptions = this._private__rendererOptions;
        const currentFontSize = this._private__fontSize();
        const currentFontFamily = this._private__fontFamily();
        if (rendererOptions._internal_fontSize !== currentFontSize || rendererOptions._internal_fontFamily !== currentFontFamily) {
            rendererOptions._internal_fontSize = currentFontSize;
            rendererOptions._internal_fontFamily = currentFontFamily;
            rendererOptions._internal_font = makeFont(currentFontSize, currentFontFamily);
            rendererOptions._internal_paddingTop = 2.5 / 12 * currentFontSize; // 2.5 px for 12px font
            rendererOptions._internal_paddingBottom = rendererOptions._internal_paddingTop;
            rendererOptions._internal_paddingInner = currentFontSize / 12 * rendererOptions._internal_tickLength;
            rendererOptions._internal_paddingOuter = currentFontSize / 12 * rendererOptions._internal_tickLength;
            rendererOptions._internal_baselineOffset = 0;
        }
        rendererOptions._internal_color = this._private__textColor();
        rendererOptions._internal_paneBackgroundColor = this._private__paneBackgroundColor();
        return this._private__rendererOptions;
    }
    _private__textColor() {
        return this._private__chartModel._internal_options()['layout'].textColor;
    }
    _private__paneBackgroundColor() {
        return this._private__chartModel._internal_backgroundTopColor();
    }
    _private__fontSize() {
        return this._private__chartModel._internal_options()['layout'].fontSize;
    }
    _private__fontFamily() {
        return this._private__chartModel._internal_options()['layout'].fontFamily;
    }
}

function normalizeRgbComponent(component) {
    if (component < 0) {
        return 0;
    }
    if (component > 255) {
        return 255;
    }
    // NaN values are treated as 0
    return (Math.round(component) || 0);
}
function normalizeAlphaComponent(component) {
    if (component <= 0 || component > 1) {
        return Math.min(Math.max(component, 0), 1);
    }
    // limit the precision of all numbers to at most 4 digits in fractional part
    return (Math.round(component * 10000) / 10000);
}
function rgbaToGrayscale(rgbValue) {
    // Originally, the NTSC RGB to YUV formula
    // perfected by @eugene-korobko's black magic
    const redComponentGrayscaleWeight = 0.199;
    const greenComponentGrayscaleWeight = 0.687;
    const blueComponentGrayscaleWeight = 0.114;
    return (redComponentGrayscaleWeight * rgbValue[0] +
        greenComponentGrayscaleWeight * rgbValue[1] +
        blueComponentGrayscaleWeight * rgbValue[2]);
}
/**
 * For colors which fall within the sRGB space, the browser can
 * be used to convert the color string into a rgb /rgba string.
 *
 * For other colors, it will be returned as specified (i.e. for
 * newer formats like display-p3)
 *
 * See: https://www.w3.org/TR/css-color-4/#serializing-sRGB-values
 */
function getRgbStringViaBrowser(color) {
    const element = document.createElement('div');
    element.style.display = 'none';
    // We append to the body as it is the most reliable way to get a color reading
    // appending to the chart container or similar element can result in the following
    // getComputedStyle returning empty strings on each check.
    document.body.appendChild(element);
    element.style.color = color;
    const computed = window.getComputedStyle(element).color;
    document.body.removeChild(element);
    return computed;
}
class ColorParser {
    constructor(customParsers, initialCache) {
        this._private__rgbaCache = new Map();
        this._private__customParsers = customParsers;
        if (initialCache) {
            this._private__rgbaCache = initialCache;
        }
    }
    /**
     * We fallback to RGBA here since supporting alpha transformations
     * on wider color gamuts would currently be a lot of extra code
     * for very little benefit due to actual usage.
     */
    _internal_applyAlpha(color, alpha) {
        // special case optimization
        if (color === 'transparent') {
            return color;
        }
        const originRgba = this._private__parseColor(color);
        const originAlpha = originRgba[3];
        return `rgba(${originRgba[0]}, ${originRgba[1]}, ${originRgba[2]}, ${alpha * originAlpha})`;
    }
    _internal_generateContrastColors(background) {
        const rgba = this._private__parseColor(background);
        return {
            _internal_background: `rgb(${rgba[0]}, ${rgba[1]}, ${rgba[2]})`, // no alpha
            _internal_foreground: rgbaToGrayscale(rgba) > 160 ? 'black' : 'white',
        };
    }
    _internal_colorStringToGrayscale(background) {
        return rgbaToGrayscale(this._private__parseColor(background));
    }
    _internal_gradientColorAtPercent(topColor, bottomColor, percent) {
        const [topR, topG, topB, topA] = this._private__parseColor(topColor);
        const [bottomR, bottomG, bottomB, bottomA] = this._private__parseColor(bottomColor);
        const resultRgba = [
            normalizeRgbComponent((topR + percent * (bottomR - topR))),
            normalizeRgbComponent((topG + percent * (bottomG - topG))),
            normalizeRgbComponent((topB + percent * (bottomB - topB))),
            normalizeAlphaComponent((topA + percent * (bottomA - topA))),
        ];
        return `rgba(${resultRgba[0]}, ${resultRgba[1]}, ${resultRgba[2]}, ${resultRgba[3]})`;
    }
    _private__parseColor(color) {
        const cached = this._private__rgbaCache.get(color);
        if (cached) {
            return cached;
        }
        const computed = getRgbStringViaBrowser(color);
        const match = computed.match(/^rgba?\s*\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/);
        if (!match) {
            if (this._private__customParsers.length) {
                for (const parser of this._private__customParsers) {
                    const result = parser(color);
                    if (result) {
                        this._private__rgbaCache.set(color, result);
                        return result;
                    }
                }
            }
            throw new Error(`Failed to parse color: ${color}`);
        }
        const rgba = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3], 10),
            (match[4] ? parseFloat(match[4]) : 1),
        ];
        this._private__rgbaCache.set(color, rgba);
        return rgba;
    }
}

class CompositeRenderer {
    constructor() {
        this._private__renderers = [];
    }
    _internal_setRenderers(renderers) {
        this._private__renderers = renderers;
    }
    _internal_draw(target, isHovered, hitTestData) {
        this._private__renderers.forEach((r) => {
            r._internal_draw(target, isHovered, hitTestData);
        });
    }
}

class BitmapCoordinatesPaneRenderer {
    _internal_draw(target, isHovered, hitTestData) {
        target.useBitmapCoordinateSpace((scope) => this._internal__drawImpl(scope, isHovered, hitTestData));
    }
}

class PaneRendererMarks extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._internal__data = null;
    }
    _internal_setData(data) {
        this._internal__data = data;
    }
    _internal__drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._internal__data === null || this._internal__data._internal_visibleRange === null) {
            return;
        }
        const visibleRange = this._internal__data._internal_visibleRange;
        const data = this._internal__data;
        const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
        const correction = (tickWidth % 2) / 2;
        const draw = (radiusMedia) => {
            ctx.beginPath();
            for (let i = visibleRange.to - 1; i >= visibleRange.from; --i) {
                const point = data._internal_items[i];
                const centerX = Math.round(point._internal_x * horizontalPixelRatio) + correction; // correct x coordinate only
                const centerY = point._internal_y * verticalPixelRatio;
                const radius = radiusMedia * verticalPixelRatio + correction;
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            }
            ctx.fill();
        };
        if (data._internal_lineWidth > 0) {
            ctx.fillStyle = data._internal_backColor;
            draw(data._internal_radius + data._internal_lineWidth);
        }
        ctx.fillStyle = data._internal_lineColor;
        draw(data._internal_radius);
    }
}

function createEmptyMarkerData() {
    return {
        _internal_items: [{
                _internal_x: 0,
                _internal_y: 0,
                _internal_time: 0,
                _internal_price: 0,
            }],
        _internal_lineColor: '',
        _internal_backColor: '',
        _internal_radius: 0,
        _internal_lineWidth: 0,
        _internal_visibleRange: null,
    };
}
const rangeForSinglePoint = { from: 0, to: 1 };
class CrosshairMarksPaneView {
    constructor(chartModel, crosshair, pane) {
        this._private__compositeRenderer = new CompositeRenderer();
        this._private__markersRenderers = [];
        this._private__markersData = [];
        this._private__invalidated = true;
        this._private__chartModel = chartModel;
        this._private__crosshair = crosshair;
        this._private__pane = pane;
        this._private__compositeRenderer._internal_setRenderers(this._private__markersRenderers);
    }
    _internal_update(updateType) {
        this._private__createMarkerRenderersIfNeeded();
        this._private__invalidated = true;
    }
    _internal_renderer() {
        if (this._private__invalidated) {
            this._private__updateImpl();
            this._private__invalidated = false;
        }
        return this._private__compositeRenderer;
    }
    _private__createMarkerRenderersIfNeeded() {
        const serieses = this._private__pane._internal_orderedSources();
        if (serieses.length !== this._private__markersRenderers.length) {
            this._private__markersData = serieses.map(createEmptyMarkerData);
            this._private__markersRenderers = this._private__markersData.map((data) => {
                const res = new PaneRendererMarks();
                res._internal_setData(data);
                return res;
            });
            this._private__compositeRenderer._internal_setRenderers(this._private__markersRenderers);
        }
    }
    _private__updateImpl() {
        const forceHidden = this._private__crosshair._internal_options().mode === 2 /* CrosshairMode.Hidden */ || !this._private__crosshair._internal_visible();
        const serieses = this._private__pane._internal_orderedSeries();
        const timePointIndex = this._private__crosshair._internal_appliedIndex();
        const timeScale = this._private__chartModel._internal_timeScale();
        this._private__createMarkerRenderersIfNeeded();
        serieses.forEach((s, index) => {
            const data = this._private__markersData[index];
            const seriesData = s._internal_markerDataAtIndex(timePointIndex);
            const firstValue = s._internal_firstValue();
            if (forceHidden || seriesData === null || !s._internal_visible() || firstValue === null) {
                data._internal_visibleRange = null;
                return;
            }
            data._internal_lineColor = seriesData._internal_backgroundColor;
            data._internal_radius = seriesData._internal_radius;
            data._internal_lineWidth = seriesData._internal_borderWidth;
            data._internal_items[0]._internal_price = seriesData._internal_price;
            data._internal_items[0]._internal_y = s._internal_priceScale()._internal_priceToCoordinate(seriesData._internal_price, firstValue._internal_value);
            data._internal_backColor = seriesData._internal_borderColor ?? this._private__chartModel._internal_backgroundColorAtYPercentFromTop(data._internal_items[0]._internal_y / s._internal_priceScale()._internal_height());
            data._internal_items[0]._internal_time = timePointIndex;
            data._internal_items[0]._internal_x = timeScale._internal_indexToCoordinate(timePointIndex);
            data._internal_visibleRange = rangeForSinglePoint;
        });
    }
}

class CrosshairRenderer extends BitmapCoordinatesPaneRenderer {
    constructor(data) {
        super();
        this._private__data = data;
    }
    _internal__drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._private__data === null) {
            return;
        }
        const vertLinesVisible = this._private__data._internal_vertLine._internal_visible;
        const horzLinesVisible = this._private__data._internal_horzLine._internal_visible;
        if (!vertLinesVisible && !horzLinesVisible) {
            return;
        }
        const x = Math.round(this._private__data._internal_x * horizontalPixelRatio);
        const y = Math.round(this._private__data._internal_y * verticalPixelRatio);
        ctx.lineCap = 'butt';
        if (vertLinesVisible && x >= 0) {
            ctx.lineWidth = Math.floor(this._private__data._internal_vertLine._internal_lineWidth * horizontalPixelRatio);
            ctx.strokeStyle = this._private__data._internal_vertLine._internal_color;
            ctx.fillStyle = this._private__data._internal_vertLine._internal_color;
            setLineStyle(ctx, this._private__data._internal_vertLine._internal_lineStyle);
            drawVerticalLine(ctx, x, 0, bitmapSize.height);
        }
        if (horzLinesVisible && y >= 0) {
            ctx.lineWidth = Math.floor(this._private__data._internal_horzLine._internal_lineWidth * verticalPixelRatio);
            ctx.strokeStyle = this._private__data._internal_horzLine._internal_color;
            ctx.fillStyle = this._private__data._internal_horzLine._internal_color;
            setLineStyle(ctx, this._private__data._internal_horzLine._internal_lineStyle);
            drawHorizontalLine(ctx, y, 0, bitmapSize.width);
        }
    }
}

class CrosshairPaneView {
    constructor(source, pane) {
        this._private__invalidated = true;
        this._private__rendererData = {
            _internal_vertLine: {
                _internal_lineWidth: 1,
                _internal_lineStyle: 0,
                _internal_color: '',
                _internal_visible: false,
            },
            _internal_horzLine: {
                _internal_lineWidth: 1,
                _internal_lineStyle: 0,
                _internal_color: '',
                _internal_visible: false,
            },
            _internal_x: 0,
            _internal_y: 0,
        };
        this._private__renderer = new CrosshairRenderer(this._private__rendererData);
        this._private__source = source;
        this._private__pane = pane;
    }
    _internal_update() {
        this._private__invalidated = true;
    }
    _internal_renderer(pane) {
        if (this._private__invalidated) {
            this._private__updateImpl();
            this._private__invalidated = false;
        }
        return this._private__renderer;
    }
    _private__updateImpl() {
        const visible = this._private__source._internal_visible();
        const crosshairOptions = this._private__pane._internal_model()._internal_options().crosshair;
        const data = this._private__rendererData;
        if (crosshairOptions.mode === 2 /* CrosshairMode.Hidden */) {
            data._internal_horzLine._internal_visible = false;
            data._internal_vertLine._internal_visible = false;
            return;
        }
        data._internal_horzLine._internal_visible = visible && this._private__source._internal_horzLineVisible(this._private__pane);
        data._internal_vertLine._internal_visible = visible && this._private__source._internal_vertLineVisible();
        data._internal_horzLine._internal_lineWidth = crosshairOptions.horzLine.width;
        data._internal_horzLine._internal_lineStyle = crosshairOptions.horzLine.style;
        data._internal_horzLine._internal_color = crosshairOptions.horzLine.color;
        data._internal_vertLine._internal_lineWidth = crosshairOptions.vertLine.width;
        data._internal_vertLine._internal_lineStyle = crosshairOptions.vertLine.style;
        data._internal_vertLine._internal_color = crosshairOptions.vertLine.color;
        data._internal_x = this._private__source._internal_appliedX();
        data._internal_y = this._private__source._internal_appliedY();
    }
}

/**
 * Fills rectangle's inner border (so, all the filled area is limited by the [x, x + width]*[y, y + height] region)
 * ```
 * (x, y)
 * O***********************|*****
 * |        border         |  ^
 * |   *****************   |  |
 * |   |               |   |  |
 * | b |               | b |  h
 * | o |               | o |  e
 * | r |               | r |  i
 * | d |               | d |  g
 * | e |               | e |  h
 * | r |               | r |  t
 * |   |               |   |  |
 * |   *****************   |  |
 * |        border         |  v
 * |***********************|*****
 * |                       |
 * |<------- width ------->|
 * ```
 *
 * @param ctx - Context to draw on
 * @param x - Left side of the target rectangle
 * @param y - Top side of the target rectangle
 * @param width - Width of the target rectangle
 * @param height - Height of the target rectangle
 * @param borderWidth - Width of border to fill, must be less than width and height of the target rectangle
 */
function fillRectInnerBorder(ctx, x, y, width, height, borderWidth) {
    // horizontal (top and bottom) edges
    ctx.fillRect(x + borderWidth, y, width - borderWidth * 2, borderWidth);
    ctx.fillRect(x + borderWidth, y + height - borderWidth, width - borderWidth * 2, borderWidth);
    // vertical (left and right) edges
    ctx.fillRect(x, y, borderWidth, height);
    ctx.fillRect(x + width - borderWidth, y, borderWidth, height);
}
function clearRect(ctx, x, y, w, h, clearColor) {
    ctx.save();
    ctx.globalCompositeOperation = 'copy';
    ctx.fillStyle = clearColor;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
}
function changeBorderRadius(borderRadius, offset) {
    return borderRadius.map((x) => x === 0 ? x : x + offset);
}
function drawRoundRect(
// eslint:disable-next-line:max-params
ctx, x, y, w, h, radii) {
    /**
     * As of May 2023, all of the major browsers now support ctx.roundRect() so we should
     * be able to switch to the native version soon.
     */
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, radii);
        return;
    }
    /*
     * Deprecate the rest in v5.
     */
    ctx.lineTo(x + w - radii[1], y);
    if (radii[1] !== 0) {
        ctx.arcTo(x + w, y, x + w, y + radii[1], radii[1]);
    }
    ctx.lineTo(x + w, y + h - radii[2]);
    if (radii[2] !== 0) {
        ctx.arcTo(x + w, y + h, x + w - radii[2], y + h, radii[2]);
    }
    ctx.lineTo(x + radii[3], y + h);
    if (radii[3] !== 0) {
        ctx.arcTo(x, y + h, x, y + h - radii[3], radii[3]);
    }
    ctx.lineTo(x, y + radii[0]);
    if (radii[0] !== 0) {
        ctx.arcTo(x, y, x + radii[0], y, radii[0]);
    }
}
/**
 * Draws a rounded rect with a border.
 *
 * This function assumes that the colors will be solid, without
 * any alpha. (This allows us to fix a rendering artefact.)
 *
 * @param outerBorderRadius - The radius of the border (outer edge)
 */
// eslint-disable-next-line max-params
function drawRoundRectWithBorder(ctx, left, top, width, height, backgroundColor, borderWidth = 0, outerBorderRadius = [0, 0, 0, 0], borderColor = '') {
    ctx.save();
    if (!borderWidth || !borderColor || borderColor === backgroundColor) {
        drawRoundRect(ctx, left, top, width, height, outerBorderRadius);
        ctx.fillStyle = backgroundColor;
        ctx.fill();
        ctx.restore();
        return;
    }
    const halfBorderWidth = borderWidth / 2;
    const radii = changeBorderRadius(outerBorderRadius, -halfBorderWidth);
    drawRoundRect(ctx, left + halfBorderWidth, top + halfBorderWidth, width - borderWidth, height - borderWidth, radii);
    if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fill();
    }
    if (borderColor !== 'transparent') {
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor;
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();
}
// eslint-disable-next-line max-params
function clearRectWithGradient(ctx, x, y, w, h, topColor, bottomColor) {
    ctx.save();
    ctx.globalCompositeOperation = 'copy';
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
}

class PriceAxisViewRenderer {
    constructor(data, commonData) {
        this._internal_setData(data, commonData);
    }
    _internal_setData(data, commonData) {
        this._private__data = data;
        this._private__commonData = commonData;
    }
    _internal_height(rendererOptions, useSecondLine) {
        if (!this._private__data._internal_visible) {
            return 0;
        }
        return rendererOptions._internal_fontSize + rendererOptions._internal_paddingTop + rendererOptions._internal_paddingBottom;
    }
    _internal_draw(target, rendererOptions, textWidthCache, align) {
        if (!this._private__data._internal_visible || this._private__data._internal_text.length === 0) {
            return;
        }
        const textColor = this._private__data._internal_color;
        const backgroundColor = this._private__commonData._internal_background;
        const geometry = target.useBitmapCoordinateSpace((scope) => {
            const ctx = scope.context;
            ctx.font = rendererOptions._internal_font;
            const geom = this._private__calculateGeometry(scope, rendererOptions, textWidthCache, align);
            const gb = geom._internal_bitmap;
            /*
             draw label. backgroundColor will always be a solid color (no alpha) [see generateContrastColors in color.ts].
             Therefore we can draw the rounded label using simplified code (drawRoundRectWithBorder) that doesn't need to ensure the background and the border don't overlap.
            */
            if (geom._internal_alignRight) {
                drawRoundRectWithBorder(ctx, gb._internal_xOutside, gb._internal_yTop, gb._internal_totalWidth, gb._internal_totalHeight, backgroundColor, gb._internal_horzBorder, [gb._internal_radius, 0, 0, gb._internal_radius], backgroundColor);
            }
            else {
                drawRoundRectWithBorder(ctx, gb._internal_xInside, gb._internal_yTop, gb._internal_totalWidth, gb._internal_totalHeight, backgroundColor, gb._internal_horzBorder, [0, gb._internal_radius, gb._internal_radius, 0], backgroundColor);
            }
            // draw tick
            if (this._private__data._internal_tickVisible) {
                ctx.fillStyle = textColor;
                ctx.fillRect(gb._internal_xInside, gb._internal_yMid, gb._internal_xTick - gb._internal_xInside, gb._internal_tickHeight);
            }
            // draw separator
            if (this._private__data._internal_borderVisible) {
                ctx.fillStyle = rendererOptions._internal_paneBackgroundColor;
                ctx.fillRect(geom._internal_alignRight ? gb._internal_right - gb._internal_horzBorder : 0, gb._internal_yTop, gb._internal_horzBorder, gb._internal_yBottom - gb._internal_yTop);
            }
            return geom;
        });
        target.useMediaCoordinateSpace(({ context: ctx }) => {
            const gm = geometry._internal_media;
            ctx.font = rendererOptions._internal_font;
            ctx.textAlign = geometry._internal_alignRight ? 'right' : 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = textColor;
            ctx.fillText(this._private__data._internal_text, gm._internal_xText, (gm._internal_yTop + gm._internal_yBottom) / 2 + gm._internal_textMidCorrection);
        });
    }
    _private__calculateGeometry(scope, rendererOptions, textWidthCache, align) {
        const { context: ctx, bitmapSize, mediaSize, horizontalPixelRatio, verticalPixelRatio } = scope;
        const tickSize = (this._private__data._internal_tickVisible || !this._private__data._internal_moveTextToInvisibleTick) ? rendererOptions._internal_tickLength : 0;
        const horzBorder = this._private__data._internal_separatorVisible ? rendererOptions._internal_borderSize : 0;
        const paddingTop = rendererOptions._internal_paddingTop + this._private__commonData._internal_additionalPaddingTop;
        const paddingBottom = rendererOptions._internal_paddingBottom + this._private__commonData._internal_additionalPaddingBottom;
        const paddingInner = rendererOptions._internal_paddingInner;
        const paddingOuter = rendererOptions._internal_paddingOuter;
        const text = this._private__data._internal_text;
        const actualTextHeight = rendererOptions._internal_fontSize;
        const textMidCorrection = textWidthCache._internal_yMidCorrection(ctx, text);
        const textWidth = Math.ceil(textWidthCache._internal_measureText(ctx, text));
        const totalHeight = actualTextHeight + paddingTop + paddingBottom;
        const totalWidth = rendererOptions._internal_borderSize + paddingInner + paddingOuter + textWidth + tickSize;
        const tickHeightBitmap = Math.max(1, Math.floor(verticalPixelRatio));
        let totalHeightBitmap = Math.round(totalHeight * verticalPixelRatio);
        if (totalHeightBitmap % 2 !== tickHeightBitmap % 2) {
            totalHeightBitmap += 1;
        }
        const horzBorderBitmap = horzBorder > 0 ? Math.max(1, Math.floor(horzBorder * horizontalPixelRatio)) : 0;
        const totalWidthBitmap = Math.round(totalWidth * horizontalPixelRatio);
        // tick overlaps scale border
        const tickSizeBitmap = Math.round(tickSize * horizontalPixelRatio);
        const yMid = this._private__commonData._internal_fixedCoordinate ?? this._private__commonData._internal_coordinate;
        const yMidBitmap = Math.round(yMid * verticalPixelRatio) - Math.floor(verticalPixelRatio * 0.5);
        const yTopBitmap = Math.floor(yMidBitmap + tickHeightBitmap / 2 - totalHeightBitmap / 2);
        const yBottomBitmap = yTopBitmap + totalHeightBitmap;
        const alignRight = align === 'right';
        const xInside = alignRight ? mediaSize.width - horzBorder : horzBorder;
        const xInsideBitmap = alignRight ? bitmapSize.width - horzBorderBitmap : horzBorderBitmap;
        let xOutsideBitmap;
        let xTickBitmap;
        let xText;
        if (alignRight) {
            // 2               1
            //
            //              6  5
            //
            // 3               4
            xOutsideBitmap = xInsideBitmap - totalWidthBitmap;
            xTickBitmap = xInsideBitmap - tickSizeBitmap;
            xText = xInside - tickSize - paddingInner - horzBorder;
        }
        else {
            // 1               2
            //
            // 6  5
            //
            // 4               3
            xOutsideBitmap = xInsideBitmap + totalWidthBitmap;
            xTickBitmap = xInsideBitmap + tickSizeBitmap;
            xText = xInside + tickSize + paddingInner;
        }
        return {
            _internal_alignRight: alignRight,
            _internal_bitmap: {
                _internal_yTop: yTopBitmap,
                _internal_yMid: yMidBitmap,
                _internal_yBottom: yBottomBitmap,
                _internal_totalWidth: totalWidthBitmap,
                _internal_totalHeight: totalHeightBitmap,
                // TODO: it is better to have different horizontal and vertical radii
                _internal_radius: 2 * horizontalPixelRatio,
                _internal_horzBorder: horzBorderBitmap,
                _internal_xOutside: xOutsideBitmap,
                _internal_xInside: xInsideBitmap,
                _internal_xTick: xTickBitmap,
                _internal_tickHeight: tickHeightBitmap,
                _internal_right: bitmapSize.width,
            },
            _internal_media: {
                _internal_yTop: yTopBitmap / verticalPixelRatio,
                _internal_yBottom: yBottomBitmap / verticalPixelRatio,
                _internal_xText: xText,
                _internal_textMidCorrection: textMidCorrection,
            },
        };
    }
}

class PriceAxisView {
    constructor(ctor) {
        this._private__commonRendererData = {
            _internal_coordinate: 0,
            _internal_background: '#000',
            _internal_additionalPaddingBottom: 0,
            _internal_additionalPaddingTop: 0,
        };
        this._private__axisRendererData = {
            _internal_text: '',
            _internal_visible: false,
            _internal_tickVisible: true,
            _internal_moveTextToInvisibleTick: false,
            _internal_borderColor: '',
            _internal_color: '#FFF',
            _internal_borderVisible: false,
            _internal_separatorVisible: false,
        };
        this._private__paneRendererData = {
            _internal_text: '',
            _internal_visible: false,
            _internal_tickVisible: false,
            _internal_moveTextToInvisibleTick: true,
            _internal_borderColor: '',
            _internal_color: '#FFF',
            _internal_borderVisible: true,
            _internal_separatorVisible: true,
        };
        this._private__invalidated = true;
        this._private__axisRenderer = new (ctor || PriceAxisViewRenderer)(this._private__axisRendererData, this._private__commonRendererData);
        this._private__paneRenderer = new (ctor || PriceAxisViewRenderer)(this._private__paneRendererData, this._private__commonRendererData);
    }
    _internal_text() {
        this._private__updateRendererDataIfNeeded();
        return this._private__axisRendererData._internal_text;
    }
    _internal_coordinate() {
        this._private__updateRendererDataIfNeeded();
        return this._private__commonRendererData._internal_coordinate;
    }
    _internal_update() {
        this._private__invalidated = true;
    }
    _internal_height(rendererOptions, useSecondLine = false) {
        return Math.max(this._private__axisRenderer._internal_height(rendererOptions, useSecondLine), this._private__paneRenderer._internal_height(rendererOptions, useSecondLine));
    }
    _internal_getFixedCoordinate() {
        return this._private__commonRendererData._internal_fixedCoordinate || 0;
    }
    _internal_setFixedCoordinate(value) {
        this._private__commonRendererData._internal_fixedCoordinate = value;
    }
    _internal_isVisible() {
        this._private__updateRendererDataIfNeeded();
        return this._private__axisRendererData._internal_visible || this._private__paneRendererData._internal_visible;
    }
    _internal_isAxisLabelVisible() {
        this._private__updateRendererDataIfNeeded();
        return this._private__axisRendererData._internal_visible;
    }
    _internal_renderer(priceScale) {
        this._private__updateRendererDataIfNeeded();
        // force update tickVisible state from price scale options
        // because we don't have and we can't have price axis in other methods
        // (like paneRenderer or any other who call _updateRendererDataIfNeeded)
        this._private__axisRendererData._internal_tickVisible = this._private__axisRendererData._internal_tickVisible && priceScale._internal_options().ticksVisible;
        this._private__paneRendererData._internal_tickVisible = this._private__paneRendererData._internal_tickVisible && priceScale._internal_options().ticksVisible;
        this._private__axisRenderer._internal_setData(this._private__axisRendererData, this._private__commonRendererData);
        this._private__paneRenderer._internal_setData(this._private__paneRendererData, this._private__commonRendererData);
        return this._private__axisRenderer;
    }
    _internal_paneRenderer() {
        this._private__updateRendererDataIfNeeded();
        this._private__axisRenderer._internal_setData(this._private__axisRendererData, this._private__commonRendererData);
        this._private__paneRenderer._internal_setData(this._private__paneRendererData, this._private__commonRendererData);
        return this._private__paneRenderer;
    }
    _private__updateRendererDataIfNeeded() {
        if (this._private__invalidated) {
            this._private__axisRendererData._internal_tickVisible = true;
            this._private__paneRendererData._internal_tickVisible = false;
            this._internal__updateRendererData(this._private__axisRendererData, this._private__paneRendererData, this._private__commonRendererData);
        }
    }
}

class CrosshairPriceAxisView extends PriceAxisView {
    constructor(source, priceScale, valueProvider) {
        super();
        this._private__source = source;
        this._private__priceScale = priceScale;
        this._private__valueProvider = valueProvider;
    }
    _internal__updateRendererData(axisRendererData, paneRendererData, commonRendererData) {
        axisRendererData._internal_visible = false;
        if (this._private__source._internal_options().mode === 2 /* CrosshairMode.Hidden */) {
            return;
        }
        const options = this._private__source._internal_options().horzLine;
        if (!options.labelVisible) {
            return;
        }
        const firstValue = this._private__priceScale._internal_firstValue();
        if (!this._private__source._internal_visible() || this._private__priceScale._internal_isEmpty() || (firstValue === null)) {
            return;
        }
        const colors = this._private__priceScale._internal_colorParser()._internal_generateContrastColors(options.labelBackgroundColor);
        commonRendererData._internal_background = colors._internal_background;
        axisRendererData._internal_color = colors._internal_foreground;
        const additionalPadding = 2 / 12 * this._private__priceScale._internal_fontSize();
        commonRendererData._internal_additionalPaddingTop = additionalPadding;
        commonRendererData._internal_additionalPaddingBottom = additionalPadding;
        const value = this._private__valueProvider(this._private__priceScale);
        commonRendererData._internal_coordinate = value._internal_coordinate;
        axisRendererData._internal_text = this._private__priceScale._internal_formatPrice(value._internal_price, firstValue);
        axisRendererData._internal_visible = true;
    }
}

const optimizationReplacementRe = /[1-9]/g;
const radius$1 = 2;
class TimeAxisViewRenderer {
    constructor() {
        this._private__data = null;
    }
    _internal_setData(data) {
        this._private__data = data;
    }
    _internal_draw(target, rendererOptions) {
        if (this._private__data === null || this._private__data._internal_visible === false || this._private__data._internal_text.length === 0) {
            return;
        }
        const textWidth = target.useMediaCoordinateSpace(({ context: ctx }) => {
            ctx.font = rendererOptions._internal_font;
            return Math.round(rendererOptions._internal_widthCache._internal_measureText(ctx, ensureNotNull(this._private__data)._internal_text, optimizationReplacementRe));
        });
        if (textWidth <= 0) {
            return;
        }
        const horzMargin = rendererOptions._internal_paddingHorizontal;
        const labelWidth = textWidth + 2 * horzMargin;
        const labelWidthHalf = labelWidth / 2;
        const timeScaleWidth = this._private__data._internal_width;
        let coordinate = this._private__data._internal_coordinate;
        let x1 = Math.floor(coordinate - labelWidthHalf) + 0.5;
        if (x1 < 0) {
            coordinate = coordinate + Math.abs(0 - x1);
            x1 = Math.floor(coordinate - labelWidthHalf) + 0.5;
        }
        else if (x1 + labelWidth > timeScaleWidth) {
            coordinate = coordinate - Math.abs(timeScaleWidth - (x1 + labelWidth));
            x1 = Math.floor(coordinate - labelWidthHalf) + 0.5;
        }
        const x2 = x1 + labelWidth;
        const y1 = 0;
        const y2 = Math.ceil(y1 +
            rendererOptions._internal_borderSize +
            rendererOptions._internal_tickLength +
            rendererOptions._internal_paddingTop +
            rendererOptions._internal_fontSize +
            rendererOptions._internal_paddingBottom);
        target.useBitmapCoordinateSpace(({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) => {
            const data = ensureNotNull(this._private__data);
            ctx.fillStyle = data._internal_background;
            const x1scaled = Math.round(x1 * horizontalPixelRatio);
            const y1scaled = Math.round(y1 * verticalPixelRatio);
            const x2scaled = Math.round(x2 * horizontalPixelRatio);
            const y2scaled = Math.round(y2 * verticalPixelRatio);
            const radiusScaled = Math.round(radius$1 * horizontalPixelRatio);
            ctx.beginPath();
            ctx.moveTo(x1scaled, y1scaled);
            ctx.lineTo(x1scaled, y2scaled - radiusScaled);
            ctx.arcTo(x1scaled, y2scaled, x1scaled + radiusScaled, y2scaled, radiusScaled);
            ctx.lineTo(x2scaled - radiusScaled, y2scaled);
            ctx.arcTo(x2scaled, y2scaled, x2scaled, y2scaled - radiusScaled, radiusScaled);
            ctx.lineTo(x2scaled, y1scaled);
            ctx.fill();
            if (data._internal_tickVisible) {
                const tickX = Math.round(data._internal_coordinate * horizontalPixelRatio);
                const tickTop = y1scaled;
                const tickBottom = Math.round((tickTop + rendererOptions._internal_tickLength) * verticalPixelRatio);
                ctx.fillStyle = data._internal_color;
                const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
                const tickOffset = Math.floor(horizontalPixelRatio * 0.5);
                ctx.fillRect(tickX - tickOffset, tickTop, tickWidth, tickBottom - tickTop);
            }
        });
        target.useMediaCoordinateSpace(({ context: ctx }) => {
            const data = ensureNotNull(this._private__data);
            const yText = y1 +
                rendererOptions._internal_borderSize +
                rendererOptions._internal_tickLength +
                rendererOptions._internal_paddingTop +
                rendererOptions._internal_fontSize / 2;
            ctx.font = rendererOptions._internal_font;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = data._internal_color;
            const textYCorrection = rendererOptions._internal_widthCache._internal_yMidCorrection(ctx, 'Apr0');
            ctx.translate(x1 + horzMargin, yText + textYCorrection);
            ctx.fillText(data._internal_text, 0, 0);
        });
    }
}

class CrosshairTimeAxisView {
    constructor(crosshair, model, valueProvider) {
        this._private__invalidated = true;
        this._private__renderer = new TimeAxisViewRenderer();
        this._private__rendererData = {
            _internal_visible: false,
            _internal_background: '#4c525e',
            _internal_color: 'white',
            _internal_text: '',
            _internal_width: 0,
            _internal_coordinate: NaN,
            _internal_tickVisible: true,
        };
        this._private__crosshair = crosshair;
        this._private__model = model;
        this._private__valueProvider = valueProvider;
    }
    _internal_update() {
        this._private__invalidated = true;
    }
    _internal_renderer() {
        if (this._private__invalidated) {
            this._private__updateImpl();
            this._private__invalidated = false;
        }
        this._private__renderer._internal_setData(this._private__rendererData);
        return this._private__renderer;
    }
    _private__updateImpl() {
        const data = this._private__rendererData;
        data._internal_visible = false;
        if (this._private__crosshair._internal_options().mode === 2 /* CrosshairMode.Hidden */) {
            return;
        }
        const options = this._private__crosshair._internal_options().vertLine;
        if (!options.labelVisible) {
            return;
        }
        const timeScale = this._private__model._internal_timeScale();
        if (timeScale._internal_isEmpty()) {
            return;
        }
        data._internal_width = timeScale._internal_width();
        const value = this._private__valueProvider();
        if (value === null) {
            return;
        }
        data._internal_coordinate = value._internal_coordinate;
        const currentTime = timeScale._internal_indexToTimeScalePoint(this._private__crosshair._internal_appliedIndex());
        data._internal_text = timeScale._internal_formatDateTime(ensureNotNull(currentTime));
        data._internal_visible = true;
        const colors = this._private__model._internal_colorParser()._internal_generateContrastColors(options.labelBackgroundColor);
        data._internal_background = colors._internal_background;
        data._internal_color = colors._internal_foreground;
        data._internal_tickVisible = timeScale._internal_options().ticksVisible;
    }
}

class DataSource {
    constructor() {
        this._internal__priceScale = null;
        this._private__zorder = 0;
    }
    _internal_zorder() {
        return this._private__zorder;
    }
    _internal_setZorder(zorder) {
        this._private__zorder = zorder;
    }
    _internal_priceScale() {
        return this._internal__priceScale;
    }
    _internal_setPriceScale(priceScale) {
        this._internal__priceScale = priceScale;
    }
    _internal_labelPaneViews(pane) {
        return [];
    }
    _internal_timeAxisViews() {
        return [];
    }
    _internal_visible() {
        return true;
    }
}

/**
 * Represents the crosshair mode.
 */
var CrosshairMode;
(function (CrosshairMode) {
    /**
     * This mode allows crosshair to move freely on the chart.
     */
    CrosshairMode[CrosshairMode["Normal"] = 0] = "Normal";
    /**
     * This mode sticks crosshair's horizontal line to the price value of a single-value series or to the close price of OHLC-based series.
     */
    CrosshairMode[CrosshairMode["Magnet"] = 1] = "Magnet";
    /**
     * This mode disables rendering of the crosshair.
     */
    CrosshairMode[CrosshairMode["Hidden"] = 2] = "Hidden";
})(CrosshairMode || (CrosshairMode = {}));
class Crosshair extends DataSource {
    constructor(model, options) {
        super();
        this._private__pane = null;
        this._private__price = NaN;
        this._private__index = 0;
        this._private__visible = true;
        this._private__priceAxisViews = new Map();
        this._private__subscribed = false;
        this._private__crosshairPaneViewCache = new WeakMap();
        this._private__markersPaneViewCache = new WeakMap();
        this._private__x = NaN;
        this._private__y = NaN;
        this._private__originX = NaN;
        this._private__originY = NaN;
        this._private__model = model;
        this._private__options = options;
        const valuePriceProvider = (rawPriceProvider, rawCoordinateProvider) => {
            return (priceScale) => {
                const coordinate = rawCoordinateProvider();
                const rawPrice = rawPriceProvider();
                if (priceScale === ensureNotNull(this._private__pane)._internal_defaultPriceScale()) {
                    // price must be defined
                    return { _internal_price: rawPrice, _internal_coordinate: coordinate };
                }
                else {
                    // always convert from coordinate
                    const firstValue = ensureNotNull(priceScale._internal_firstValue());
                    const price = priceScale._internal_coordinateToPrice(coordinate, firstValue);
                    return { _internal_price: price, _internal_coordinate: coordinate };
                }
            };
        };
        const valueTimeProvider = (rawIndexProvider, rawCoordinateProvider) => {
            return () => {
                const time = this._private__model._internal_timeScale()._internal_indexToTime(rawIndexProvider());
                const coordinate = rawCoordinateProvider();
                if (!time || !Number.isFinite(coordinate)) {
                    return null;
                }
                return {
                    _internal_time: time,
                    _internal_coordinate: coordinate,
                };
            };
        };
        // for current position always return both price and coordinate
        this._private__currentPosPriceProvider = valuePriceProvider(() => this._private__price, () => this._private__y);
        const currentPosTimeProvider = valueTimeProvider(() => this._private__index, () => this._internal_appliedX());
        this._private__timeAxisView = new CrosshairTimeAxisView(this, model, currentPosTimeProvider);
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_saveOriginCoord(x, y) {
        this._private__originX = x;
        this._private__originY = y;
    }
    _internal_clearOriginCoord() {
        this._private__originX = NaN;
        this._private__originY = NaN;
    }
    _internal_originCoordX() {
        return this._private__originX;
    }
    _internal_originCoordY() {
        return this._private__originY;
    }
    _internal_setPosition(index, price, pane) {
        if (!this._private__subscribed) {
            this._private__subscribed = true;
        }
        this._private__visible = true;
        this._private__tryToUpdateViews(index, price, pane);
    }
    _internal_appliedIndex() {
        return this._private__index;
    }
    _internal_appliedX() {
        return this._private__x;
    }
    _internal_appliedY() {
        return this._private__y;
    }
    _internal_visible() {
        return this._private__visible;
    }
    _internal_clearPosition() {
        this._private__visible = false;
        this._private__setIndexToLastSeriesBarIndex();
        this._private__price = NaN;
        this._private__x = NaN;
        this._private__y = NaN;
        this._private__pane = null;
        this._internal_clearOriginCoord();
        this._internal_updateAllViews();
    }
    _internal_paneViews(pane) {
        let crosshairPaneView = this._private__crosshairPaneViewCache.get(pane);
        if (!crosshairPaneView) {
            crosshairPaneView = new CrosshairPaneView(this, pane);
            this._private__crosshairPaneViewCache.set(pane, crosshairPaneView);
        }
        let markersPaneView = this._private__markersPaneViewCache.get(pane);
        if (!markersPaneView) {
            markersPaneView = new CrosshairMarksPaneView(this._private__model, this, pane);
            this._private__markersPaneViewCache.set(pane, markersPaneView);
        }
        return [crosshairPaneView, markersPaneView];
    }
    _internal_horzLineVisible(pane) {
        return pane === this._private__pane && this._private__options.horzLine.visible;
    }
    _internal_vertLineVisible() {
        return this._private__options.vertLine.visible;
    }
    _internal_priceAxisViews(pane, priceScale) {
        if (!this._private__visible || this._private__pane !== pane) {
            this._private__priceAxisViews.clear();
        }
        const views = [];
        if (this._private__pane === pane) {
            views.push(this._private__createPriceAxisViewOnDemand(this._private__priceAxisViews, priceScale, this._private__currentPosPriceProvider));
        }
        return views;
    }
    _internal_timeAxisViews() {
        return this._private__visible ? [this._private__timeAxisView] : [];
    }
    _internal_pane() {
        return this._private__pane;
    }
    _internal_updateAllViews() {
        this._private__model._internal_panes().forEach((pane) => {
            this._private__crosshairPaneViewCache.get(pane)?._internal_update();
            this._private__markersPaneViewCache.get(pane)?._internal_update();
        });
        this._private__priceAxisViews.forEach((value) => value._internal_update());
        this._private__timeAxisView._internal_update();
    }
    _private__priceScaleByPane(pane) {
        if (pane && !pane._internal_defaultPriceScale()._internal_isEmpty()) {
            return pane._internal_defaultPriceScale();
        }
        return null;
    }
    _private__tryToUpdateViews(index, price, pane) {
        if (this._private__tryToUpdateData(index, price, pane)) {
            this._internal_updateAllViews();
        }
    }
    _private__tryToUpdateData(newIndex, newPrice, newPane) {
        const oldX = this._private__x;
        const oldY = this._private__y;
        const oldPrice = this._private__price;
        const oldIndex = this._private__index;
        const oldPane = this._private__pane;
        const priceScale = this._private__priceScaleByPane(newPane);
        this._private__index = newIndex;
        this._private__x = isNaN(newIndex) ? NaN : this._private__model._internal_timeScale()._internal_indexToCoordinate(newIndex);
        this._private__pane = newPane;
        const firstValue = priceScale !== null ? priceScale._internal_firstValue() : null;
        if (priceScale !== null && firstValue !== null) {
            this._private__price = newPrice;
            this._private__y = priceScale._internal_priceToCoordinate(newPrice, firstValue);
        }
        else {
            this._private__price = NaN;
            this._private__y = NaN;
        }
        return (oldX !== this._private__x || oldY !== this._private__y || oldIndex !== this._private__index ||
            oldPrice !== this._private__price || oldPane !== this._private__pane);
    }
    _private__setIndexToLastSeriesBarIndex() {
        const lastIndexes = this._private__model._internal_serieses()
            .map((s) => s._internal_bars()._internal_lastIndex())
            .filter(notNull);
        const lastBarIndex = (lastIndexes.length === 0) ? null : Math.max(...lastIndexes);
        this._private__index = lastBarIndex !== null ? lastBarIndex : NaN;
    }
    _private__createPriceAxisViewOnDemand(map, priceScale, valueProvider) {
        let view = map.get(priceScale);
        if (view === undefined) {
            view = new CrosshairPriceAxisView(this, priceScale, valueProvider);
            map.set(priceScale, view);
        }
        return view;
    }
}

function isDefaultPriceScale(priceScaleId) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    return priceScaleId === "left" /* DefaultPriceScaleId.Left */ || priceScaleId === "right" /* DefaultPriceScaleId.Right */;
}

function mergePaneInvalidation(beforeValue, newValue) {
    if (beforeValue === undefined) {
        return newValue;
    }
    const level = Math.max(beforeValue._internal_level, newValue._internal_level);
    const autoScale = beforeValue._internal_autoScale || newValue._internal_autoScale;
    return { _internal_level: level, _internal_autoScale: autoScale };
}
class InvalidateMask {
    constructor(globalLevel) {
        this._private__invalidatedPanes = new Map();
        this._private__timeScaleInvalidations = [];
        this._private__globalLevel = globalLevel;
    }
    _internal_invalidatePane(paneIndex, invalidation) {
        const prevValue = this._private__invalidatedPanes.get(paneIndex);
        const newValue = mergePaneInvalidation(prevValue, invalidation);
        this._private__invalidatedPanes.set(paneIndex, newValue);
    }
    _internal_fullInvalidation() {
        return this._private__globalLevel;
    }
    _internal_invalidateForPane(paneIndex) {
        const paneInvalidation = this._private__invalidatedPanes.get(paneIndex);
        if (paneInvalidation === undefined) {
            return {
                _internal_level: this._private__globalLevel,
            };
        }
        return {
            _internal_level: Math.max(this._private__globalLevel, paneInvalidation._internal_level),
            _internal_autoScale: paneInvalidation._internal_autoScale,
        };
    }
    _internal_setFitContent() {
        this._internal_stopTimeScaleAnimation();
        // modifies both bar spacing and right offset
        this._private__timeScaleInvalidations = [{ _internal_type: 0 /* TimeScaleInvalidationType.FitContent */ }];
    }
    _internal_applyRange(range) {
        this._internal_stopTimeScaleAnimation();
        // modifies both bar spacing and right offset
        this._private__timeScaleInvalidations = [{ _internal_type: 1 /* TimeScaleInvalidationType.ApplyRange */, _internal_value: range }];
    }
    _internal_setTimeScaleAnimation(animation) {
        this._private__removeTimeScaleAnimation();
        this._private__timeScaleInvalidations.push({ _internal_type: 5 /* TimeScaleInvalidationType.Animation */, _internal_value: animation });
    }
    _internal_stopTimeScaleAnimation() {
        this._private__removeTimeScaleAnimation();
        this._private__timeScaleInvalidations.push({ _internal_type: 6 /* TimeScaleInvalidationType.StopAnimation */ });
    }
    _internal_resetTimeScale() {
        this._internal_stopTimeScaleAnimation();
        // modifies both bar spacing and right offset
        this._private__timeScaleInvalidations = [{ _internal_type: 4 /* TimeScaleInvalidationType.Reset */ }];
    }
    _internal_setBarSpacing(barSpacing) {
        this._internal_stopTimeScaleAnimation();
        this._private__timeScaleInvalidations.push({ _internal_type: 2 /* TimeScaleInvalidationType.ApplyBarSpacing */, _internal_value: barSpacing });
    }
    _internal_setRightOffset(offset) {
        this._internal_stopTimeScaleAnimation();
        this._private__timeScaleInvalidations.push({ _internal_type: 3 /* TimeScaleInvalidationType.ApplyRightOffset */, _internal_value: offset });
    }
    _internal_timeScaleInvalidations() {
        return this._private__timeScaleInvalidations;
    }
    _internal_merge(other) {
        for (const tsInvalidation of other._private__timeScaleInvalidations) {
            this._private__applyTimeScaleInvalidation(tsInvalidation);
        }
        this._private__globalLevel = Math.max(this._private__globalLevel, other._private__globalLevel);
        other._private__invalidatedPanes.forEach((invalidation, index) => {
            this._internal_invalidatePane(index, invalidation);
        });
    }
    static _internal_light() {
        return new InvalidateMask(2 /* InvalidationLevel.Light */);
    }
    static _internal_full() {
        return new InvalidateMask(3 /* InvalidationLevel.Full */);
    }
    _private__applyTimeScaleInvalidation(invalidation) {
        switch (invalidation._internal_type) {
            case 0 /* TimeScaleInvalidationType.FitContent */:
                this._internal_setFitContent();
                break;
            case 1 /* TimeScaleInvalidationType.ApplyRange */:
                this._internal_applyRange(invalidation._internal_value);
                break;
            case 2 /* TimeScaleInvalidationType.ApplyBarSpacing */:
                this._internal_setBarSpacing(invalidation._internal_value);
                break;
            case 3 /* TimeScaleInvalidationType.ApplyRightOffset */:
                this._internal_setRightOffset(invalidation._internal_value);
                break;
            case 4 /* TimeScaleInvalidationType.Reset */:
                this._internal_resetTimeScale();
                break;
            case 5 /* TimeScaleInvalidationType.Animation */:
                this._internal_setTimeScaleAnimation(invalidation._internal_value);
                break;
            case 6 /* TimeScaleInvalidationType.StopAnimation */:
                this._private__removeTimeScaleAnimation();
        }
    }
    _private__removeTimeScaleAnimation() {
        const index = this._private__timeScaleInvalidations.findIndex((inv) => inv._internal_type === 5 /* TimeScaleInvalidationType.Animation */);
        if (index !== -1) {
            this._private__timeScaleInvalidations.splice(index, 1);
        }
    }
}

const formatterOptions = {
    _internal_decimalSign: '.',
    _internal_decimalSignFractional: '\'',
};
/**
 * @param value - The number of convert.
 * @param length - The length. Must be between 0 and 16 inclusive.
 */
function numberToStringWithLeadingZero(value, length) {
    if (!isNumber(value)) {
        return 'n/a';
    }
    if (!isInteger(length)) {
        throw new TypeError('invalid length');
    }
    if (length < 0 || length > 16) {
        throw new TypeError('invalid length');
    }
    if (length === 0) {
        return value.toString();
    }
    const dummyString = '0000000000000000';
    return (dummyString + value.toString()).slice(-length);
}
class PriceFormatter {
    constructor(priceScale, minMove) {
        if (!minMove) {
            minMove = 1;
        }
        if (!isNumber(priceScale) || !isInteger(priceScale)) {
            priceScale = 100;
        }
        if (priceScale < 0) {
            throw new TypeError('invalid base');
        }
        this._private__priceScale = priceScale;
        this._private__minMove = minMove;
        this._private__calculateDecimal();
    }
    format(price) {
        // \u2212 is unicode's minus sign https://www.fileformat.info/info/unicode/char/2212/index.htm
        // we should use it because it has the same width as plus sign +
        const sign = price < 0 ? '\u2212' : '';
        price = Math.abs(price);
        return sign + this._private__formatAsDecimal(price);
    }
    _private__calculateDecimal() {
        // check if this._base is power of 10
        // for double fractional _fractionalLength if for the main fractional only
        this._internal__fractionalLength = 0;
        if (this._private__priceScale > 0 && this._private__minMove > 0) {
            let base = this._private__priceScale;
            while (base > 1) {
                base /= 10;
                this._internal__fractionalLength++;
            }
        }
    }
    _private__formatAsDecimal(price) {
        const base = this._private__priceScale / this._private__minMove;
        let intPart = Math.floor(price);
        let fracString = '';
        const fracLength = this._internal__fractionalLength !== undefined ? this._internal__fractionalLength : NaN;
        if (base > 1) {
            let fracPart = +(Math.round(price * base) - intPart * base).toFixed(this._internal__fractionalLength);
            if (fracPart >= base) {
                fracPart -= base;
                intPart += 1;
            }
            fracString = formatterOptions._internal_decimalSign + numberToStringWithLeadingZero(+fracPart.toFixed(this._internal__fractionalLength) * this._private__minMove, fracLength);
        }
        else {
            // should round int part to min move
            intPart = Math.round(intPart * base) / base;
            // if min move > 1, fractional part is always = 0
            if (fracLength > 0) {
                fracString = formatterOptions._internal_decimalSign + numberToStringWithLeadingZero(0, fracLength);
            }
        }
        return intPart.toFixed(0) + fracString;
    }
}

class PercentageFormatter extends PriceFormatter {
    constructor(priceScale = 100) {
        super(priceScale);
    }
    format(price) {
        return `${super.format(price)}%`;
    }
}

class VolumeFormatter {
    constructor(precision) {
        this._private__precision = precision;
    }
    format(vol) {
        let sign = '';
        if (vol < 0) {
            sign = '-';
            vol = -vol;
        }
        if (vol < 995) {
            return sign + this._private__formatNumber(vol);
        }
        else if (vol < 999995) {
            return sign + this._private__formatNumber(vol / 1000) + 'K';
        }
        else if (vol < 999999995) {
            vol = 1000 * Math.round(vol / 1000);
            return sign + this._private__formatNumber(vol / 1000000) + 'M';
        }
        else {
            vol = 1000000 * Math.round(vol / 1000000);
            return sign + this._private__formatNumber(vol / 1000000000) + 'B';
        }
    }
    _private__formatNumber(value) {
        let res;
        const priceScale = Math.pow(10, this._private__precision);
        value = Math.round(value * priceScale) / priceScale;
        if (value >= 1e-15 && value < 1) {
            res = value.toFixed(this._private__precision).replace(/\.?0+$/, ''); // regex removes trailing zeroes
        }
        else {
            res = String(value);
        }
        return res.replace(/(\.[1-9]*)0+$/, (e, p1) => p1);
    }
}

const defaultReplacementRe = /[2-9]/g;
class TextWidthCache {
    constructor(size = 50) {
        this._private__actualSize = 0;
        this._private__usageTick = 1;
        this._private__oldestTick = 1;
        this._private__tick2Labels = {};
        this._private__cache = new Map();
        this._private__maxSize = size;
    }
    _internal_reset() {
        this._private__actualSize = 0;
        this._private__cache.clear();
        this._private__usageTick = 1;
        this._private__oldestTick = 1;
        this._private__tick2Labels = {};
    }
    _internal_measureText(ctx, text, optimizationReplacementRe) {
        return this._private__getMetrics(ctx, text, optimizationReplacementRe).width;
    }
    _internal_yMidCorrection(ctx, text, optimizationReplacementRe) {
        const metrics = this._private__getMetrics(ctx, text, optimizationReplacementRe);
        // if actualBoundingBoxAscent/actualBoundingBoxDescent are not supported we use 0 as a fallback
        return ((metrics.actualBoundingBoxAscent || 0) - (metrics.actualBoundingBoxDescent || 0)) / 2;
    }
    _private__getMetrics(ctx, text, optimizationReplacementRe) {
        const re = optimizationReplacementRe || defaultReplacementRe;
        const cacheString = String(text).replace(re, '0');
        if (this._private__cache.has(cacheString)) {
            return ensureDefined(this._private__cache.get(cacheString))._internal_metrics;
        }
        if (this._private__actualSize === this._private__maxSize) {
            const oldestValue = this._private__tick2Labels[this._private__oldestTick];
            delete this._private__tick2Labels[this._private__oldestTick];
            this._private__cache.delete(oldestValue);
            this._private__oldestTick++;
            this._private__actualSize--;
        }
        ctx.save();
        ctx.textBaseline = 'middle';
        const metrics = ctx.measureText(cacheString);
        ctx.restore();
        if (metrics.width === 0 && !!text.length) {
            // measureText can return 0 in FF depending on a canvas size, don't cache it
            return metrics;
        }
        this._private__cache.set(cacheString, { _internal_metrics: metrics, _internal_tick: this._private__usageTick });
        this._private__tick2Labels[this._private__usageTick] = cacheString;
        this._private__actualSize++;
        this._private__usageTick++;
        return metrics;
    }
}

class PanePriceAxisViewRenderer {
    constructor(textWidthCache) {
        this._private__priceAxisViewRenderer = null;
        this._private__rendererOptions = null;
        this._private__align = 'right';
        this._private__textWidthCache = textWidthCache;
    }
    _internal_setParams(priceAxisViewRenderer, rendererOptions, align) {
        this._private__priceAxisViewRenderer = priceAxisViewRenderer;
        this._private__rendererOptions = rendererOptions;
        this._private__align = align;
    }
    _internal_draw(target) {
        if (this._private__rendererOptions === null || this._private__priceAxisViewRenderer === null) {
            return;
        }
        this._private__priceAxisViewRenderer._internal_draw(target, this._private__rendererOptions, this._private__textWidthCache, this._private__align);
    }
}
class PanePriceAxisView {
    constructor(priceAxisView, dataSource, chartModel) {
        this._private__priceAxisView = priceAxisView;
        this._private__textWidthCache = new TextWidthCache(50); // when should we clear cache?
        this._private__dataSource = dataSource;
        this._private__chartModel = chartModel;
        this._private__fontSize = -1;
        this._private__renderer = new PanePriceAxisViewRenderer(this._private__textWidthCache);
    }
    _internal_renderer() {
        const pane = this._private__chartModel._internal_paneForSource(this._private__dataSource);
        if (pane === null) {
            return null;
        }
        // this price scale will be used to find label placement only (left, right, none)
        const priceScale = pane._internal_isOverlay(this._private__dataSource) ? pane._internal_defaultVisiblePriceScale() : this._private__dataSource._internal_priceScale();
        if (priceScale === null) {
            return null;
        }
        const position = pane._internal_priceScalePosition(priceScale);
        if (position === 'overlay') {
            return null;
        }
        const options = this._private__chartModel._internal_priceAxisRendererOptions();
        if (options._internal_fontSize !== this._private__fontSize) {
            this._private__fontSize = options._internal_fontSize;
            this._private__textWidthCache._internal_reset();
        }
        this._private__renderer._internal_setParams(this._private__priceAxisView._internal_paneRenderer(), options, position);
        return this._private__renderer;
    }
}

class HorizontalLineRenderer extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._private__data = null;
    }
    _internal_setData(data) {
        this._private__data = data;
    }
    _internal_hitTest(x, y) {
        if (!this._private__data?._internal_visible) {
            return null;
        }
        const { _internal_y: itemY, _internal_lineWidth: lineWidth, _internal_externalId: externalId } = this._private__data;
        // add a fixed area threshold around line (Y + width) for hit test
        if (y >= itemY - lineWidth - 7 /* Constants.HitTestThreshold */ && y <= itemY + lineWidth + 7 /* Constants.HitTestThreshold */) {
            return {
                _internal_hitTestData: this._private__data,
                _internal_externalId: externalId,
            };
        }
        return null;
    }
    _internal__drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._private__data === null) {
            return;
        }
        if (this._private__data._internal_visible === false) {
            return;
        }
        const y = Math.round(this._private__data._internal_y * verticalPixelRatio);
        if (y < 0 || y > bitmapSize.height) {
            return;
        }
        ctx.lineCap = 'butt';
        ctx.strokeStyle = this._private__data._internal_color;
        ctx.lineWidth = Math.floor(this._private__data._internal_lineWidth * horizontalPixelRatio);
        setLineStyle(ctx, this._private__data._internal_lineStyle);
        drawHorizontalLine(ctx, y, 0, bitmapSize.width);
    }
}

class SeriesHorizontalLinePaneView {
    constructor(series) {
        this._internal__lineRendererData = {
            _internal_y: 0,
            _internal_color: 'rgba(0, 0, 0, 0)',
            _internal_lineWidth: 1,
            _internal_lineStyle: 0 /* LineStyle.Solid */,
            _internal_visible: false,
        };
        this._internal__lineRenderer = new HorizontalLineRenderer();
        this._private__invalidated = true;
        this._internal__series = series;
        this._internal__model = series._internal_model();
        this._internal__lineRenderer._internal_setData(this._internal__lineRendererData);
    }
    _internal_update() {
        this._private__invalidated = true;
    }
    _internal_renderer() {
        if (!this._internal__series._internal_visible()) {
            return null;
        }
        if (this._private__invalidated) {
            this._internal__updateImpl();
            this._private__invalidated = false;
        }
        return this._internal__lineRenderer;
    }
}

class SeriesHorizontalBaseLinePaneView extends SeriesHorizontalLinePaneView {
    // eslint-disable-next-line no-useless-constructor
    constructor(series) {
        super(series);
    }
    _internal__updateImpl() {
        this._internal__lineRendererData._internal_visible = false;
        const priceScale = this._internal__series._internal_priceScale();
        const mode = priceScale._internal_mode()._internal_mode;
        if (mode !== 2 /* PriceScaleMode.Percentage */ && mode !== 3 /* PriceScaleMode.IndexedTo100 */) {
            return;
        }
        const seriesOptions = this._internal__series._internal_options();
        if (!seriesOptions.baseLineVisible || !this._internal__series._internal_visible()) {
            return;
        }
        const firstValue = this._internal__series._internal_firstValue();
        if (firstValue === null) {
            return;
        }
        this._internal__lineRendererData._internal_visible = true;
        this._internal__lineRendererData._internal_y = priceScale._internal_priceToCoordinate(firstValue._internal_value, firstValue._internal_value);
        this._internal__lineRendererData._internal_color = seriesOptions.baseLineColor;
        this._internal__lineRendererData._internal_lineWidth = seriesOptions.baseLineWidth;
        this._internal__lineRendererData._internal_lineStyle = seriesOptions.baseLineStyle;
    }
}

class SeriesLastPriceAnimationRenderer extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._private__data = null;
    }
    _internal_setData(data) {
        this._private__data = data;
    }
    _internal_data() {
        return this._private__data;
    }
    _internal__drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) {
        const data = this._private__data;
        if (data === null) {
            return;
        }
        const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
        const correction = (tickWidth % 2) / 2;
        const centerX = Math.round(data._internal_center.x * horizontalPixelRatio) + correction; // correct x coordinate only
        const centerY = data._internal_center.y * verticalPixelRatio;
        ctx.fillStyle = data._internal_seriesLineColor;
        ctx.beginPath();
        // TODO: it is better to have different horizontal and vertical radii
        const centerPointRadius = Math.max(2, data._internal_seriesLineWidth * 1.5) * horizontalPixelRatio;
        ctx.arc(centerX, centerY, centerPointRadius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.fillStyle = data._internal_fillColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, data._internal_radius * horizontalPixelRatio, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.lineWidth = tickWidth;
        ctx.strokeStyle = data._internal_strokeColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, data._internal_radius * horizontalPixelRatio + tickWidth / 2, 0, 2 * Math.PI, false);
        ctx.stroke();
    }
}

const animationStagesData = [
    {
        _internal_start: 0,
        _internal_end: 0.25 /* Constants.Stage1Period */,
        _internal_startRadius: 4 /* Constants.Stage1StartCircleRadius */,
        _internal_endRadius: 10 /* Constants.Stage1EndCircleRadius */,
        _internal_startFillAlpha: 0.25 /* Constants.Stage1StartFillAlpha */,
        _internal_endFillAlpha: 0 /* Constants.Stage1EndFillAlpha */,
        _internal_startStrokeAlpha: 0.4 /* Constants.Stage1StartStrokeAlpha */,
        _internal_endStrokeAlpha: 0.8 /* Constants.Stage1EndStrokeAlpha */,
    },
    {
        _internal_start: 0.25 /* Constants.Stage1Period */,
        _internal_end: 0.25 /* Constants.Stage1Period */ + 0.275 /* Constants.Stage2Period */,
        _internal_startRadius: 10 /* Constants.Stage2StartCircleRadius */,
        _internal_endRadius: 14 /* Constants.Stage2EndCircleRadius */,
        _internal_startFillAlpha: 0 /* Constants.Stage2StartFillAlpha */,
        _internal_endFillAlpha: 0 /* Constants.Stage2EndFillAlpha */,
        _internal_startStrokeAlpha: 0.8 /* Constants.Stage2StartStrokeAlpha */,
        _internal_endStrokeAlpha: 0 /* Constants.Stage2EndStrokeAlpha */,
    },
    {
        _internal_start: 0.25 /* Constants.Stage1Period */ + 0.275 /* Constants.Stage2Period */,
        _internal_end: 0.25 /* Constants.Stage1Period */ + 0.275 /* Constants.Stage2Period */ + 0.475 /* Constants.Stage3Period */,
        _internal_startRadius: 14 /* Constants.Stage3StartCircleRadius */,
        _internal_endRadius: 14 /* Constants.Stage3EndCircleRadius */,
        _internal_startFillAlpha: 0 /* Constants.Stage3StartFillAlpha */,
        _internal_endFillAlpha: 0 /* Constants.Stage3EndFillAlpha */,
        _internal_startStrokeAlpha: 0 /* Constants.Stage3StartStrokeAlpha */,
        _internal_endStrokeAlpha: 0 /* Constants.Stage3EndStrokeAlpha */,
    },
];
function radius(stage, startRadius, endRadius) {
    return startRadius + (endRadius - startRadius) * stage;
}
class SeriesLastPriceAnimationPaneView {
    constructor(series) {
        this._private__renderer = new SeriesLastPriceAnimationRenderer();
        this._private__invalidated = true;
        this._private__stageInvalidated = true;
        this._private__startTime = performance.now();
        this._private__endTime = this._private__startTime - 1;
        this._private__series = series;
    }
    _internal_onDataCleared() {
        this._private__endTime = this._private__startTime - 1;
        this._internal_update();
    }
    _internal_onNewRealtimeDataReceived() {
        this._internal_update();
        if (this._private__series._internal_options().lastPriceAnimation === 2 /* LastPriceAnimationMode.OnDataUpdate */) {
            const now = performance.now();
            const timeToAnimationEnd = this._private__endTime - now;
            if (timeToAnimationEnd > 0) {
                if (timeToAnimationEnd < 2600 /* Constants.AnimationPeriod */ / 4) {
                    this._private__endTime += 2600 /* Constants.AnimationPeriod */;
                }
                return;
            }
            this._private__startTime = now;
            this._private__endTime = now + 2600 /* Constants.AnimationPeriod */;
        }
    }
    _internal_update() {
        this._private__invalidated = true;
    }
    _internal_invalidateStage() {
        this._private__stageInvalidated = true;
    }
    _internal_visible() {
        // center point is always visible if lastPriceAnimation is not LastPriceAnimationMode.Disabled
        return this._private__series._internal_options().lastPriceAnimation !== 0 /* LastPriceAnimationMode.Disabled */;
    }
    _internal_animationActive() {
        switch (this._private__series._internal_options().lastPriceAnimation) {
            case 0 /* LastPriceAnimationMode.Disabled */:
                return false;
            case 1 /* LastPriceAnimationMode.Continuous */:
                return true;
            case 2 /* LastPriceAnimationMode.OnDataUpdate */:
                return performance.now() <= this._private__endTime;
        }
    }
    _internal_renderer() {
        if (this._private__invalidated) {
            this._private__updateImpl();
            this._private__invalidated = false;
            this._private__stageInvalidated = false;
        }
        else if (this._private__stageInvalidated) {
            this._private__updateRendererDataStage();
            this._private__stageInvalidated = false;
        }
        return this._private__renderer;
    }
    _private__updateImpl() {
        this._private__renderer._internal_setData(null);
        const timeScale = this._private__series._internal_model()._internal_timeScale();
        const visibleRange = timeScale._internal_visibleStrictRange();
        const firstValue = this._private__series._internal_firstValue();
        if (visibleRange === null || firstValue === null) {
            return;
        }
        const lastValue = this._private__series._internal_lastValueData(true);
        if (lastValue._internal_noData || !visibleRange._internal_contains(lastValue._internal_index)) {
            return;
        }
        const lastValuePoint = {
            x: timeScale._internal_indexToCoordinate(lastValue._internal_index),
            y: this._private__series._internal_priceScale()._internal_priceToCoordinate(lastValue._internal_price, firstValue._internal_value),
        };
        const seriesLineColor = lastValue._internal_color;
        const seriesLineWidth = this._private__series._internal_options().lineWidth;
        const data = this._private__animationData(this._private__duration(), seriesLineColor);
        this._private__renderer._internal_setData({
            _internal_seriesLineColor: seriesLineColor,
            _internal_seriesLineWidth: seriesLineWidth,
            _internal_fillColor: data._internal_fillColor,
            _internal_strokeColor: data._internal_strokeColor,
            _internal_radius: data._internal_radius,
            _internal_center: lastValuePoint,
        });
    }
    _private__updateRendererDataStage() {
        const rendererData = this._private__renderer._internal_data();
        if (rendererData !== null) {
            const data = this._private__animationData(this._private__duration(), rendererData._internal_seriesLineColor);
            rendererData._internal_fillColor = data._internal_fillColor;
            rendererData._internal_strokeColor = data._internal_strokeColor;
            rendererData._internal_radius = data._internal_radius;
        }
    }
    _private__duration() {
        return this._internal_animationActive() ? performance.now() - this._private__startTime : 2600 /* Constants.AnimationPeriod */ - 1;
    }
    _private__color(seriesLineColor, stage, startAlpha, endAlpha) {
        const alpha = startAlpha + (endAlpha - startAlpha) * stage;
        return this._private__series._internal_model()._internal_colorParser()._internal_applyAlpha(seriesLineColor, alpha);
    }
    _private__animationData(durationSinceStart, lineColor) {
        const globalStage = (durationSinceStart % 2600 /* Constants.AnimationPeriod */) / 2600 /* Constants.AnimationPeriod */;
        let currentStageData;
        for (const stageData of animationStagesData) {
            if (globalStage >= stageData._internal_start && globalStage <= stageData._internal_end) {
                currentStageData = stageData;
                break;
            }
        }
        assert(currentStageData !== undefined, 'Last price animation internal logic error');
        const subStage = (globalStage - currentStageData._internal_start) / (currentStageData._internal_end - currentStageData._internal_start);
        return {
            _internal_fillColor: this._private__color(lineColor, subStage, currentStageData._internal_startFillAlpha, currentStageData._internal_endFillAlpha),
            _internal_strokeColor: this._private__color(lineColor, subStage, currentStageData._internal_startStrokeAlpha, currentStageData._internal_endStrokeAlpha),
            _internal_radius: radius(subStage, currentStageData._internal_startRadius, currentStageData._internal_endRadius),
        };
    }
}

class SeriesPriceLinePaneView extends SeriesHorizontalLinePaneView {
    // eslint-disable-next-line no-useless-constructor
    constructor(series) {
        super(series);
    }
    _internal__updateImpl() {
        const data = this._internal__lineRendererData;
        data._internal_visible = false;
        const seriesOptions = this._internal__series._internal_options();
        if (!seriesOptions.priceLineVisible || !this._internal__series._internal_visible()) {
            return;
        }
        const lastValueData = this._internal__series._internal_lastValueData(seriesOptions.priceLineSource === 0 /* PriceLineSource.LastBar */);
        if (lastValueData._internal_noData) {
            return;
        }
        data._internal_visible = true;
        data._internal_y = lastValueData._internal_coordinate;
        data._internal_color = this._internal__series._internal_priceLineColor(lastValueData._internal_color);
        data._internal_lineWidth = seriesOptions.priceLineWidth;
        data._internal_lineStyle = seriesOptions.priceLineStyle;
    }
}

class SeriesPriceAxisView extends PriceAxisView {
    constructor(source) {
        super();
        this._private__source = source;
    }
    _internal__updateRendererData(axisRendererData, paneRendererData, commonRendererData) {
        axisRendererData._internal_visible = false;
        paneRendererData._internal_visible = false;
        const source = this._private__source;
        if (!source._internal_visible()) {
            return;
        }
        const seriesOptions = source._internal_options();
        const showSeriesLastValue = seriesOptions.lastValueVisible;
        const showSymbolLabel = source._internal_title() !== '';
        const showPriceAndPercentage = seriesOptions.seriesLastValueMode === 0 /* PriceAxisLastValueMode.LastPriceAndPercentageValue */;
        const lastValueData = source._internal_lastValueData(false);
        if (lastValueData._internal_noData) {
            return;
        }
        if (showSeriesLastValue) {
            axisRendererData._internal_text = this._internal__axisText(lastValueData, showSeriesLastValue, showPriceAndPercentage);
            axisRendererData._internal_visible = axisRendererData._internal_text.length !== 0;
        }
        if (showSymbolLabel || showPriceAndPercentage) {
            paneRendererData._internal_text = this._internal__paneText(lastValueData, showSeriesLastValue, showSymbolLabel, showPriceAndPercentage);
            paneRendererData._internal_visible = paneRendererData._internal_text.length > 0;
        }
        const lastValueColor = source._internal_priceLineColor(lastValueData._internal_color);
        const colors = this._private__source._internal_model()._internal_colorParser()._internal_generateContrastColors(lastValueColor);
        commonRendererData._internal_background = colors._internal_background;
        commonRendererData._internal_coordinate = lastValueData._internal_coordinate;
        paneRendererData._internal_borderColor = source._internal_model()._internal_backgroundColorAtYPercentFromTop(lastValueData._internal_coordinate / source._internal_priceScale()._internal_height());
        axisRendererData._internal_borderColor = lastValueColor;
        axisRendererData._internal_color = colors._internal_foreground;
        paneRendererData._internal_color = colors._internal_foreground;
    }
    _internal__paneText(lastValue, showSeriesLastValue, showSymbolLabel, showPriceAndPercentage) {
        let result = '';
        const title = this._private__source._internal_title();
        if (showSymbolLabel && title.length !== 0) {
            result += `${title} `;
        }
        if (showSeriesLastValue && showPriceAndPercentage) {
            result += this._private__source._internal_priceScale()._internal_isPercentage() ?
                lastValue._internal_formattedPriceAbsolute : lastValue._internal_formattedPricePercentage;
        }
        return result.trim();
    }
    _internal__axisText(lastValueData, showSeriesLastValue, showPriceAndPercentage) {
        if (!showSeriesLastValue) {
            return '';
        }
        if (!showPriceAndPercentage) {
            return lastValueData._internal_text;
        }
        return this._private__source._internal_priceScale()._internal_isPercentage() ?
            lastValueData._internal_formattedPricePercentage : lastValueData._internal_formattedPriceAbsolute;
    }
}

function computeFiniteResult(method, valueOne, valueTwo, fallback) {
    const firstFinite = Number.isFinite(valueOne);
    const secondFinite = Number.isFinite(valueTwo);
    if (firstFinite && secondFinite) {
        return method(valueOne, valueTwo);
    }
    return !firstFinite && !secondFinite ? fallback : (firstFinite ? valueOne : valueTwo);
}
class PriceRangeImpl {
    constructor(minValue, maxValue) {
        this._private__minValue = minValue;
        this._private__maxValue = maxValue;
    }
    _internal_equals(pr) {
        if (pr === null) {
            return false;
        }
        return this._private__minValue === pr._private__minValue && this._private__maxValue === pr._private__maxValue;
    }
    _internal_clone() {
        return new PriceRangeImpl(this._private__minValue, this._private__maxValue);
    }
    _internal_minValue() {
        return this._private__minValue;
    }
    _internal_maxValue() {
        return this._private__maxValue;
    }
    _internal_length() {
        return this._private__maxValue - this._private__minValue;
    }
    _internal_isEmpty() {
        return this._private__maxValue === this._private__minValue || Number.isNaN(this._private__maxValue) || Number.isNaN(this._private__minValue);
    }
    _internal_merge(anotherRange) {
        if (anotherRange === null) {
            return this;
        }
        return new PriceRangeImpl(computeFiniteResult(Math.min, this._internal_minValue(), anotherRange._internal_minValue(), -Infinity), computeFiniteResult(Math.max, this._internal_maxValue(), anotherRange._internal_maxValue(), Infinity));
    }
    _internal_scaleAroundCenter(coeff) {
        if (!isNumber(coeff)) {
            return;
        }
        const delta = this._private__maxValue - this._private__minValue;
        if (delta === 0) {
            return;
        }
        const center = (this._private__maxValue + this._private__minValue) * 0.5;
        let maxDelta = this._private__maxValue - center;
        let minDelta = this._private__minValue - center;
        maxDelta *= coeff;
        minDelta *= coeff;
        this._private__maxValue = center + maxDelta;
        this._private__minValue = center + minDelta;
    }
    _internal_shift(delta) {
        if (!isNumber(delta)) {
            return;
        }
        this._private__maxValue += delta;
        this._private__minValue += delta;
    }
    _internal_toRaw() {
        return {
            minValue: this._private__minValue,
            maxValue: this._private__maxValue,
        };
    }
    static _internal_fromRaw(raw) {
        return (raw === null) ? null : new PriceRangeImpl(raw.minValue, raw.maxValue);
    }
}

class AutoscaleInfoImpl {
    constructor(priceRange, margins) {
        this._private__priceRange = priceRange;
        this._private__margins = margins || null;
    }
    _internal_priceRange() {
        return this._private__priceRange;
    }
    _internal_margins() {
        return this._private__margins;
    }
    _internal_toRaw() {
        return {
            priceRange: this._private__priceRange === null ? null : this._private__priceRange._internal_toRaw(),
            margins: this._private__margins || undefined,
        };
    }
    static _internal_fromRaw(raw) {
        return (raw === null) ? null : new AutoscaleInfoImpl(PriceRangeImpl._internal_fromRaw(raw.priceRange), raw.margins);
    }
}

class CustomPriceLinePaneView extends SeriesHorizontalLinePaneView {
    constructor(series, priceLine) {
        super(series);
        this._private__priceLine = priceLine;
    }
    _internal__updateImpl() {
        const data = this._internal__lineRendererData;
        data._internal_visible = false;
        const lineOptions = this._private__priceLine._internal_options();
        if (!this._internal__series._internal_visible() || !lineOptions.lineVisible) {
            return;
        }
        const y = this._private__priceLine._internal_yCoord();
        if (y === null) {
            return;
        }
        data._internal_visible = true;
        data._internal_y = y;
        data._internal_color = lineOptions.color;
        data._internal_lineWidth = lineOptions.lineWidth;
        data._internal_lineStyle = lineOptions.lineStyle;
        data._internal_externalId = this._private__priceLine._internal_options().id;
    }
}

class CustomPriceLinePriceAxisView extends PriceAxisView {
    constructor(series, priceLine) {
        super();
        this._private__series = series;
        this._private__priceLine = priceLine;
    }
    _internal__updateRendererData(axisRendererData, paneRendererData, commonData) {
        axisRendererData._internal_visible = false;
        paneRendererData._internal_visible = false;
        const options = this._private__priceLine._internal_options();
        const labelVisible = options.axisLabelVisible;
        const showPaneLabel = options.title !== '';
        const series = this._private__series;
        if (!labelVisible || !series._internal_visible()) {
            return;
        }
        const y = this._private__priceLine._internal_yCoord();
        if (y === null) {
            return;
        }
        if (showPaneLabel) {
            paneRendererData._internal_text = options.title;
            paneRendererData._internal_visible = true;
        }
        paneRendererData._internal_borderColor = series._internal_model()._internal_backgroundColorAtYPercentFromTop(y / series._internal_priceScale()._internal_height());
        axisRendererData._internal_text = this._private__formatPrice(options.price);
        axisRendererData._internal_visible = true;
        const colors = this._private__series._internal_model()._internal_colorParser()._internal_generateContrastColors(options.axisLabelColor || options.color);
        commonData._internal_background = colors._internal_background;
        const textColor = options.axisLabelTextColor || colors._internal_foreground;
        axisRendererData._internal_color = textColor; // price text
        paneRendererData._internal_color = textColor; // title text
        commonData._internal_coordinate = y;
    }
    _private__formatPrice(price) {
        const firstValue = this._private__series._internal_firstValue();
        if (firstValue === null) {
            return '';
        }
        return this._private__series._internal_priceScale()._internal_formatPrice(price, firstValue._internal_value);
    }
}

class CustomPriceLine {
    constructor(series, options) {
        this._private__series = series;
        this._private__options = options;
        this._private__priceLineView = new CustomPriceLinePaneView(series, this);
        this._private__priceAxisView = new CustomPriceLinePriceAxisView(series, this);
        this._private__panePriceAxisView = new PanePriceAxisView(this._private__priceAxisView, series, series._internal_model());
    }
    _internal_applyOptions(options) {
        merge(this._private__options, options);
        this._internal_update();
        this._private__series._internal_model()._internal_lightUpdate();
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_paneView() {
        return this._private__priceLineView;
    }
    _internal_labelPaneView() {
        return this._private__panePriceAxisView;
    }
    _internal_priceAxisView() {
        return this._private__priceAxisView;
    }
    _internal_update() {
        this._private__priceLineView._internal_update();
        this._private__priceAxisView._internal_update();
    }
    _internal_yCoord() {
        const series = this._private__series;
        const priceScale = series._internal_priceScale();
        const timeScale = series._internal_model()._internal_timeScale();
        if (timeScale._internal_isEmpty() || priceScale._internal_isEmpty()) {
            return null;
        }
        const firstValue = series._internal_firstValue();
        if (firstValue === null) {
            return null;
        }
        return priceScale._internal_priceToCoordinate(this._private__options.price, firstValue._internal_value);
    }
}

class PriceDataSource extends DataSource {
    constructor(model) {
        super();
        this._private__model = model;
    }
    _internal_model() {
        return this._private__model;
    }
}

const barStyleFnMap = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Bar: (findBar, barStyle, barIndex, precomputedBars) => {
        const upColor = barStyle.upColor;
        const downColor = barStyle.downColor;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        const isUp = ensure(currentBar._internal_value[0 /* PlotRowValueIndex.Open */]) <= ensure(currentBar._internal_value[3 /* PlotRowValueIndex.Close */]);
        return {
            _internal_barColor: currentBar._internal_color ?? (isUp ? upColor : downColor),
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Candlestick: (findBar, candlestickStyle, barIndex, precomputedBars) => {
        const upColor = candlestickStyle.upColor;
        const downColor = candlestickStyle.downColor;
        const borderUpColor = candlestickStyle.borderUpColor;
        const borderDownColor = candlestickStyle.borderDownColor;
        const wickUpColor = candlestickStyle.wickUpColor;
        const wickDownColor = candlestickStyle.wickDownColor;
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        const isUp = ensure(currentBar._internal_value[0 /* PlotRowValueIndex.Open */]) <= ensure(currentBar._internal_value[3 /* PlotRowValueIndex.Close */]);
        return {
            _internal_barColor: currentBar._internal_color ?? (isUp ? upColor : downColor),
            _internal_barBorderColor: currentBar._internal_borderColor ?? (isUp ? borderUpColor : borderDownColor),
            _internal_barWickColor: currentBar._internal_wickColor ?? (isUp ? wickUpColor : wickDownColor),
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Custom: (findBar, customStyle, barIndex, precomputedBars) => {
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            _internal_barColor: currentBar._internal_color ?? customStyle.color,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Area: (findBar, areaStyle, barIndex, precomputedBars) => {
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            _internal_barColor: currentBar._internal_lineColor ?? areaStyle.lineColor,
            _internal_lineColor: currentBar._internal_lineColor ?? areaStyle.lineColor,
            _internal_topColor: currentBar._internal_topColor ?? areaStyle.topColor,
            _internal_bottomColor: currentBar._internal_bottomColor ?? areaStyle.bottomColor,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Baseline: (findBar, baselineStyle, barIndex, precomputedBars) => {
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        const isAboveBaseline = currentBar._internal_value[3 /* PlotRowValueIndex.Close */] >= baselineStyle.baseValue.price;
        return {
            _internal_barColor: isAboveBaseline ? baselineStyle.topLineColor : baselineStyle.bottomLineColor,
            _internal_topLineColor: currentBar._internal_topLineColor ?? baselineStyle.topLineColor,
            _internal_bottomLineColor: currentBar._internal_bottomLineColor ?? baselineStyle.bottomLineColor,
            _internal_topFillColor1: currentBar._internal_topFillColor1 ?? baselineStyle.topFillColor1,
            _internal_topFillColor2: currentBar._internal_topFillColor2 ?? baselineStyle.topFillColor2,
            _internal_bottomFillColor1: currentBar._internal_bottomFillColor1 ?? baselineStyle.bottomFillColor1,
            _internal_bottomFillColor2: currentBar._internal_bottomFillColor2 ?? baselineStyle.bottomFillColor2,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Line: (findBar, lineStyle, barIndex, precomputedBars) => {
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            _internal_barColor: currentBar._internal_color ?? lineStyle.color,
            _internal_lineColor: currentBar._internal_color ?? lineStyle.color,
        };
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Histogram: (findBar, histogramStyle, barIndex, precomputedBars) => {
        const currentBar = ensureNotNull(findBar(barIndex, precomputedBars));
        return {
            _internal_barColor: currentBar._internal_color ?? histogramStyle.color,
        };
    },
};
class SeriesBarColorer {
    constructor(series) {
        this._private__findBar = (barIndex, precomputedBars) => {
            if (precomputedBars !== undefined) {
                return precomputedBars._internal_value;
            }
            return this._private__series._internal_bars()._internal_valueAt(barIndex);
        };
        this._private__series = series;
        this._private__styleGetter = barStyleFnMap[series._internal_seriesType()];
    }
    _internal_barStyle(barIndex, precomputedBars) {
        // precomputedBars: {value: [Array BarValues], previousValue: [Array BarValues] | undefined}
        // Used to avoid binary search if bars are already known
        return this._private__styleGetter(this._private__findBar, this._private__series._internal_options(), barIndex, precomputedBars);
    }
}

/**
 * Binary function that accepts two arguments (the first of the type of array elements, and the second is always val), and returns a value convertible to bool.
 * The value returned indicates whether the first argument is considered to go before the second.
 * The function shall not modify any of its arguments.
 */
function boundCompare(lower, arr, value, compare, start = 0, to = arr.length) {
    let count = to - start;
    while (0 < count) {
        const count2 = (count >> 1);
        const mid = start + count2;
        if (compare(arr[mid], value) === lower) {
            start = mid + 1;
            count -= count2 + 1;
        }
        else {
            count = count2;
        }
    }
    return start;
}
const lowerBound = boundCompare.bind(null, true);
const upperBound = boundCompare.bind(null, false);

/**
 * Search direction if no data found at provided index
 */
var MismatchDirection;
(function (MismatchDirection) {
    /**
     * Search the nearest left item
     */
    MismatchDirection[MismatchDirection["NearestLeft"] = -1] = "NearestLeft";
    /**
     * Do not search
     */
    MismatchDirection[MismatchDirection["None"] = 0] = "None";
    /**
     * Search the nearest right item
     */
    MismatchDirection[MismatchDirection["NearestRight"] = 1] = "NearestRight";
})(MismatchDirection || (MismatchDirection = {}));
// TODO: think about changing it dynamically
const CHUNK_SIZE = 30;
/**
 * PlotList is an array of plot rows
 * each plot row consists of key (index in timescale) and plot value map
 */
class PlotList {
    constructor() {
        this._private__items = [];
        this._private__minMaxCache = new Map();
        this._private__rowSearchCache = new Map();
        this._private__indices = [];
    }
    // @returns Last row
    _internal_last() {
        return this._internal_size() > 0 ? this._private__items[this._private__items.length - 1] : null;
    }
    _internal_firstIndex() {
        return this._internal_size() > 0 ? this._private__indexAt(0) : null;
    }
    _internal_lastIndex() {
        return this._internal_size() > 0 ? this._private__indexAt((this._private__items.length - 1)) : null;
    }
    _internal_size() {
        return this._private__items.length;
    }
    _internal_isEmpty() {
        return this._internal_size() === 0;
    }
    _internal_contains(index) {
        return this._private__search(index, 0 /* MismatchDirection.None */) !== null;
    }
    _internal_valueAt(index) {
        return this._internal_search(index);
    }
    _internal_search(index, searchMode = 0 /* MismatchDirection.None */) {
        const pos = this._private__search(index, searchMode);
        if (pos === null) {
            return null;
        }
        return {
            ...this._private__valueAt(pos),
            _internal_index: this._private__indexAt(pos),
        };
    }
    _internal_rows() {
        return this._private__items;
    }
    _internal_minMaxOnRangeCached(start, end, plots) {
        // this code works for single series only
        // could fail after whitespaces implementation
        if (this._internal_isEmpty()) {
            return null;
        }
        let result = null;
        for (const plot of plots) {
            const plotMinMax = this._private__minMaxOnRangeCachedImpl(start, end, plot);
            result = mergeMinMax(result, plotMinMax);
        }
        return result;
    }
    _internal_setData(plotRows) {
        this._private__rowSearchCache.clear();
        this._private__minMaxCache.clear();
        this._private__items = plotRows;
        this._private__indices = plotRows.map((plotRow) => plotRow._internal_index);
    }
    // TimePointIndex values for fulfilled data points
    _internal_indices() {
        return this._private__indices;
    }
    _private__indexAt(offset) {
        return this._private__items[offset]._internal_index;
    }
    _private__valueAt(offset) {
        return this._private__items[offset];
    }
    _private__search(index, searchMode) {
        const exactPos = this._private__bsearch(index);
        if (exactPos === null && searchMode !== 0 /* MismatchDirection.None */) {
            switch (searchMode) {
                case -1 /* MismatchDirection.NearestLeft */:
                    return this._private__searchNearestLeft(index);
                case 1 /* MismatchDirection.NearestRight */:
                    return this._private__searchNearestRight(index);
                default:
                    throw new TypeError('Unknown search mode');
            }
        }
        return exactPos;
    }
    _private__searchNearestLeft(index) {
        let nearestLeftPos = this._private__lowerbound(index);
        if (nearestLeftPos > 0) {
            nearestLeftPos = nearestLeftPos - 1;
        }
        return (nearestLeftPos !== this._private__items.length && this._private__indexAt(nearestLeftPos) < index) ? nearestLeftPos : null;
    }
    _private__searchNearestRight(index) {
        const nearestRightPos = this._private__upperbound(index);
        return (nearestRightPos !== this._private__items.length && index < this._private__indexAt(nearestRightPos)) ? nearestRightPos : null;
    }
    _private__bsearch(index) {
        const start = this._private__lowerbound(index);
        if (start !== this._private__items.length && !(index < this._private__items[start]._internal_index)) {
            return start;
        }
        return null;
    }
    _private__lowerbound(index) {
        return lowerBound(this._private__items, index, (a, b) => a._internal_index < b);
    }
    _private__upperbound(index) {
        return upperBound(this._private__items, index, (a, b) => a._internal_index > b);
    }
    _private__plotMinMax(startIndex, endIndexExclusive, plotIndex) {
        let result = null;
        for (let i = startIndex; i < endIndexExclusive; i++) {
            const values = this._private__items[i]._internal_value;
            const v = values[plotIndex];
            if (Number.isNaN(v)) {
                continue;
            }
            if (result === null) {
                result = { _internal_min: v, _internal_max: v };
            }
            else {
                if (v < result._internal_min) {
                    result._internal_min = v;
                }
                if (v > result._internal_max) {
                    result._internal_max = v;
                }
            }
        }
        return result;
    }
    _private__minMaxOnRangeCachedImpl(start, end, plotIndex) {
        // this code works for single series only
        // could fail after whitespaces implementation
        if (this._internal_isEmpty()) {
            return null;
        }
        let result = null;
        // assume that bar indexes only increase
        const firstIndex = ensureNotNull(this._internal_firstIndex());
        const lastIndex = ensureNotNull(this._internal_lastIndex());
        const s = Math.max(start, firstIndex);
        const e = Math.min(end, lastIndex);
        const cachedLow = Math.ceil(s / CHUNK_SIZE) * CHUNK_SIZE;
        const cachedHigh = Math.max(cachedLow, Math.floor(e / CHUNK_SIZE) * CHUNK_SIZE);
        {
            const startIndex = this._private__lowerbound(s);
            const endIndex = this._private__upperbound(Math.min(e, cachedLow, end)); // non-inclusive end
            const plotMinMax = this._private__plotMinMax(startIndex, endIndex, plotIndex);
            result = mergeMinMax(result, plotMinMax);
        }
        let minMaxCache = this._private__minMaxCache.get(plotIndex);
        if (minMaxCache === undefined) {
            minMaxCache = new Map();
            this._private__minMaxCache.set(plotIndex, minMaxCache);
        }
        // now go cached
        for (let c = Math.max(cachedLow + 1, s); c < cachedHigh; c += CHUNK_SIZE) {
            const chunkIndex = Math.floor(c / CHUNK_SIZE);
            let chunkMinMax = minMaxCache.get(chunkIndex);
            if (chunkMinMax === undefined) {
                const chunkStart = this._private__lowerbound(chunkIndex * CHUNK_SIZE);
                const chunkEnd = this._private__upperbound((chunkIndex + 1) * CHUNK_SIZE - 1);
                chunkMinMax = this._private__plotMinMax(chunkStart, chunkEnd, plotIndex);
                minMaxCache.set(chunkIndex, chunkMinMax);
            }
            result = mergeMinMax(result, chunkMinMax);
        }
        // tail
        {
            const startIndex = this._private__lowerbound(cachedHigh);
            const endIndex = this._private__upperbound(e); // non-inclusive end
            const plotMinMax = this._private__plotMinMax(startIndex, endIndex, plotIndex);
            result = mergeMinMax(result, plotMinMax);
        }
        return result;
    }
}
function mergeMinMax(first, second) {
    if (first === null) {
        return second;
    }
    else {
        if (second === null) {
            return first;
        }
        else {
            // merge MinMax values
            const min = Math.min(first._internal_min, second._internal_min);
            const max = Math.max(first._internal_max, second._internal_max);
            return { _internal_min: min, _internal_max: max };
        }
    }
}

function createSeriesPlotList() {
    return new PlotList();
}

class PrimitiveRendererWrapper {
    constructor(baseRenderer) {
        this._private__baseRenderer = baseRenderer;
    }
    _internal_draw(target, isHovered, hitTestData) {
        this._private__baseRenderer.draw(target);
    }
    _internal_drawBackground(target, isHovered, hitTestData) {
        this._private__baseRenderer.drawBackground?.(target);
    }
}
class PrimitivePaneViewWrapper {
    constructor(paneView) {
        this._private__cache = null;
        this._private__paneView = paneView;
    }
    _internal_renderer() {
        const baseRenderer = this._private__paneView.renderer();
        if (baseRenderer === null) {
            return null;
        }
        if (this._private__cache?._internal_base === baseRenderer) {
            return this._private__cache._internal_wrapper;
        }
        const wrapper = new PrimitiveRendererWrapper(baseRenderer);
        this._private__cache = {
            _internal_base: baseRenderer,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_zOrder() {
        return this._private__paneView.zOrder?.() ?? 'normal';
    }
}
class PrimitiveWrapper {
    constructor(primitive) {
        this._private__paneViewsCache = null;
        this._internal__primitive = primitive;
    }
    _internal_primitive() {
        return this._internal__primitive;
    }
    _internal_updateAllViews() {
        this._internal__primitive.updateAllViews?.();
    }
    _internal_paneViews() {
        const base = this._internal__primitive.paneViews?.() ?? [];
        if (this._private__paneViewsCache?._internal_base === base) {
            return this._private__paneViewsCache._internal_wrapper;
        }
        const wrapper = base.map((pw) => new PrimitivePaneViewWrapper(pw));
        this._private__paneViewsCache = {
            _internal_base: base,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_hitTest(x, y) {
        return this._internal__primitive.hitTest?.(x, y) ?? null;
    }
}
let PanePrimitiveWrapper$1 = class PanePrimitiveWrapper extends PrimitiveWrapper {
    _internal_labelPaneViews() {
        return [];
    }
};

class SeriesPrimitiveRendererWrapper {
    constructor(baseRenderer) {
        this._private__baseRenderer = baseRenderer;
    }
    _internal_draw(target, isHovered, hitTestData) {
        this._private__baseRenderer.draw(target);
    }
    _internal_drawBackground(target, isHovered, hitTestData) {
        this._private__baseRenderer.drawBackground?.(target);
    }
}
class SeriesPrimitivePaneViewWrapper {
    constructor(paneView) {
        this._private__cache = null;
        this._private__paneView = paneView;
    }
    _internal_renderer() {
        const baseRenderer = this._private__paneView.renderer();
        if (baseRenderer === null) {
            return null;
        }
        if (this._private__cache?._internal_base === baseRenderer) {
            return this._private__cache._internal_wrapper;
        }
        const wrapper = new SeriesPrimitiveRendererWrapper(baseRenderer);
        this._private__cache = {
            _internal_base: baseRenderer,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_zOrder() {
        return this._private__paneView.zOrder?.() ?? 'normal';
    }
}
function getAxisViewData(baseView) {
    return {
        _internal_text: baseView.text(),
        _internal_coordinate: baseView.coordinate(),
        _internal_fixedCoordinate: baseView.fixedCoordinate?.(),
        _internal_color: baseView.textColor(),
        _internal_background: baseView.backColor(),
        _internal_visible: baseView.visible?.() ?? true,
        _internal_tickVisible: baseView.tickVisible?.() ?? true,
    };
}
class SeriesPrimitiveTimeAxisViewWrapper {
    constructor(baseView, timeScale) {
        this._private__renderer = new TimeAxisViewRenderer();
        this._private__baseView = baseView;
        this._private__timeScale = timeScale;
    }
    _internal_renderer() {
        this._private__renderer._internal_setData({
            _internal_width: this._private__timeScale._internal_width(),
            ...getAxisViewData(this._private__baseView),
        });
        return this._private__renderer;
    }
}
class SeriesPrimitivePriceAxisViewWrapper extends PriceAxisView {
    constructor(baseView, priceScale) {
        super();
        this._private__baseView = baseView;
        this._private__priceScale = priceScale;
    }
    _internal__updateRendererData(axisRendererData, paneRendererData, commonRendererData) {
        const data = getAxisViewData(this._private__baseView);
        commonRendererData._internal_background = data._internal_background;
        axisRendererData._internal_color = data._internal_color;
        const additionalPadding = 2 / 12 * this._private__priceScale._internal_fontSize();
        commonRendererData._internal_additionalPaddingTop = additionalPadding;
        commonRendererData._internal_additionalPaddingBottom = additionalPadding;
        commonRendererData._internal_coordinate = data._internal_coordinate;
        commonRendererData._internal_fixedCoordinate = data._internal_fixedCoordinate;
        axisRendererData._internal_text = data._internal_text;
        axisRendererData._internal_visible = data._internal_visible;
        axisRendererData._internal_tickVisible = data._internal_tickVisible;
    }
}
class SeriesPrimitiveWrapper extends PrimitiveWrapper {
    constructor(primitive, series) {
        super(primitive);
        this._private__timeAxisViewsCache = null;
        this._private__priceAxisViewsCache = null;
        this._private__priceAxisPaneViewsCache = null;
        this._private__timeAxisPaneViewsCache = null;
        this._private__series = series;
    }
    _internal_timeAxisViews() {
        const base = this._internal__primitive.timeAxisViews?.() ?? [];
        if (this._private__timeAxisViewsCache?._internal_base === base) {
            return this._private__timeAxisViewsCache._internal_wrapper;
        }
        const timeScale = this._private__series._internal_model()._internal_timeScale();
        const wrapper = base.map((aw) => new SeriesPrimitiveTimeAxisViewWrapper(aw, timeScale));
        this._private__timeAxisViewsCache = {
            _internal_base: base,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_priceAxisViews() {
        const base = this._internal__primitive.priceAxisViews?.() ?? [];
        if (this._private__priceAxisViewsCache?._internal_base === base) {
            return this._private__priceAxisViewsCache._internal_wrapper;
        }
        const priceScale = this._private__series._internal_priceScale();
        const wrapper = base.map((aw) => new SeriesPrimitivePriceAxisViewWrapper(aw, priceScale));
        this._private__priceAxisViewsCache = {
            _internal_base: base,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_priceAxisPaneViews() {
        const base = this._internal__primitive.priceAxisPaneViews?.() ?? [];
        if (this._private__priceAxisPaneViewsCache?._internal_base === base) {
            return this._private__priceAxisPaneViewsCache._internal_wrapper;
        }
        const wrapper = base.map((pw) => new SeriesPrimitivePaneViewWrapper(pw));
        this._private__priceAxisPaneViewsCache = {
            _internal_base: base,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_timeAxisPaneViews() {
        const base = this._internal__primitive.timeAxisPaneViews?.() ?? [];
        if (this._private__timeAxisPaneViewsCache?._internal_base === base) {
            return this._private__timeAxisPaneViewsCache._internal_wrapper;
        }
        const wrapper = base.map((pw) => new SeriesPrimitivePaneViewWrapper(pw));
        this._private__timeAxisPaneViewsCache = {
            _internal_base: base,
            _internal_wrapper: wrapper,
        };
        return wrapper;
    }
    _internal_autoscaleInfo(startTimePoint, endTimePoint) {
        return (this._internal__primitive.autoscaleInfo?.(startTimePoint, endTimePoint) ?? null);
    }
}

function extractPrimitivePaneViews(primitives, extractor, zOrder, destination) {
    primitives.forEach((wrapper) => {
        extractor(wrapper).forEach((paneView) => {
            if (paneView._internal_zOrder() !== zOrder) {
                return;
            }
            destination.push(paneView);
        });
    });
}
function primitivePaneViewsExtractor(wrapper) {
    return wrapper._internal_paneViews();
}
function primitivePricePaneViewsExtractor(wrapper) {
    return wrapper._internal_priceAxisPaneViews();
}
function primitiveTimePaneViewsExtractor(wrapper) {
    return wrapper._internal_timeAxisPaneViews();
}
const lineBasedSeries = ['Area', 'Line', 'Baseline'];
class Series extends PriceDataSource {
    constructor(model, seriesType, options, createPaneView, customPaneView) {
        super(model);
        this._private__data = createSeriesPlotList();
        this._private__priceLineView = new SeriesPriceLinePaneView(this);
        this._private__customPriceLines = [];
        this._private__baseHorizontalLineView = new SeriesHorizontalBaseLinePaneView(this);
        this._private__lastPriceAnimationPaneView = null;
        this._private__barColorerCache = null;
        this._private__animationTimeoutId = null;
        this._private__primitives = [];
        this._private__options = options;
        this._private__seriesType = seriesType;
        const priceAxisView = new SeriesPriceAxisView(this);
        this._private__priceAxisViews = [priceAxisView];
        this._private__panePriceAxisView = new PanePriceAxisView(priceAxisView, this, model);
        if (lineBasedSeries.includes(this._private__seriesType)) {
            this._private__lastPriceAnimationPaneView = new SeriesLastPriceAnimationPaneView(this);
        }
        this._private__recreateFormatter();
        this._private__paneView = createPaneView(this, this._internal_model(), customPaneView);
    }
    _internal_destroy() {
        if (this._private__animationTimeoutId !== null) {
            clearTimeout(this._private__animationTimeoutId);
        }
    }
    _internal_priceLineColor(lastBarColor) {
        return this._private__options.priceLineColor || lastBarColor;
    }
    _internal_lastValueData(globalLast) {
        const noDataRes = { _internal_noData: true };
        const priceScale = this._internal_priceScale();
        if (this._internal_model()._internal_timeScale()._internal_isEmpty() || priceScale._internal_isEmpty() || this._private__data._internal_isEmpty()) {
            return noDataRes;
        }
        const visibleBars = this._internal_model()._internal_timeScale()._internal_visibleStrictRange();
        const firstValue = this._internal_firstValue();
        if (visibleBars === null || firstValue === null) {
            return noDataRes;
        }
        // find range of bars inside range
        // TODO: make it more optimal
        let bar;
        let lastIndex;
        if (globalLast) {
            const lastBar = this._private__data._internal_last();
            if (lastBar === null) {
                return noDataRes;
            }
            bar = lastBar;
            lastIndex = lastBar._internal_index;
        }
        else {
            const endBar = this._private__data._internal_search(visibleBars._internal_right(), -1 /* MismatchDirection.NearestLeft */);
            if (endBar === null) {
                return noDataRes;
            }
            bar = this._private__data._internal_valueAt(endBar._internal_index);
            if (bar === null) {
                return noDataRes;
            }
            lastIndex = endBar._internal_index;
        }
        const price = bar._internal_value[3 /* PlotRowValueIndex.Close */];
        const barColorer = this._internal_barColorer();
        const style = barColorer._internal_barStyle(lastIndex, { _internal_value: bar });
        const coordinate = priceScale._internal_priceToCoordinate(price, firstValue._internal_value);
        return {
            _internal_noData: false,
            _internal_price: price,
            _internal_text: priceScale._internal_formatPrice(price, firstValue._internal_value),
            _internal_formattedPriceAbsolute: priceScale._internal_formatPriceAbsolute(price),
            _internal_formattedPricePercentage: priceScale._internal_formatPricePercentage(price, firstValue._internal_value),
            _internal_color: style._internal_barColor,
            _internal_coordinate: coordinate,
            _internal_index: lastIndex,
        };
    }
    _internal_barColorer() {
        if (this._private__barColorerCache !== null) {
            return this._private__barColorerCache;
        }
        this._private__barColorerCache = new SeriesBarColorer(this);
        return this._private__barColorerCache;
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_applyOptions(options) {
        const targetPriceScaleId = options.priceScaleId;
        if (targetPriceScaleId !== undefined && targetPriceScaleId !== this._private__options.priceScaleId) {
            // series cannot do it itself, ask model
            this._internal_model()._internal_moveSeriesToScale(this, targetPriceScaleId);
        }
        merge(this._private__options, options);
        if (options.priceFormat !== undefined) {
            this._private__recreateFormatter();
            // updated formatter might affect rendering  and as a consequence of this the width of price axis might be changed
            // thus we need to force the chart to do a full update to apply changes correctly
            // full update is quite heavy operation in terms of performance
            // but updating formatter looks like quite rare so forcing a full update here shouldn't affect the performance a lot
            this._internal_model()._internal_fullUpdate();
        }
        this._internal_model()._internal_updateSource(this);
        // a series might affect crosshair by some options (like crosshair markers)
        // that's why we need to update crosshair as well
        this._internal_model()._internal_updateCrosshair();
        this._private__paneView._internal_update('options');
    }
    _internal_setData(data, updateInfo) {
        this._private__data._internal_setData(data);
        this._private__paneView._internal_update('data');
        if (this._private__lastPriceAnimationPaneView !== null) {
            if (updateInfo && updateInfo._internal_lastBarUpdatedOrNewBarsAddedToTheRight) {
                this._private__lastPriceAnimationPaneView._internal_onNewRealtimeDataReceived();
            }
            else if (data.length === 0) {
                this._private__lastPriceAnimationPaneView._internal_onDataCleared();
            }
        }
        const sourcePane = this._internal_model()._internal_paneForSource(this);
        this._internal_model()._internal_recalculatePane(sourcePane);
        this._internal_model()._internal_updateSource(this);
        this._internal_model()._internal_updateCrosshair();
        this._internal_model()._internal_lightUpdate();
    }
    _internal_createPriceLine(options) {
        const result = new CustomPriceLine(this, options);
        this._private__customPriceLines.push(result);
        this._internal_model()._internal_updateSource(this);
        return result;
    }
    _internal_removePriceLine(line) {
        const index = this._private__customPriceLines.indexOf(line);
        if (index !== -1) {
            this._private__customPriceLines.splice(index, 1);
        }
        this._internal_model()._internal_updateSource(this);
    }
    _internal_priceLines() {
        return this._private__customPriceLines;
    }
    _internal_seriesType() {
        return this._private__seriesType;
    }
    _internal_firstValue() {
        const bar = this._internal_firstBar();
        if (bar === null) {
            return null;
        }
        return {
            _internal_value: bar._internal_value[3 /* PlotRowValueIndex.Close */],
            _internal_timePoint: bar._internal_time,
        };
    }
    _internal_firstBar() {
        const visibleBars = this._internal_model()._internal_timeScale()._internal_visibleStrictRange();
        if (visibleBars === null) {
            return null;
        }
        const startTimePoint = visibleBars._internal_left();
        return this._private__data._internal_search(startTimePoint, 1 /* MismatchDirection.NearestRight */);
    }
    _internal_bars() {
        return this._private__data;
    }
    _internal_dataAt(time) {
        const prices = this._private__data._internal_valueAt(time);
        if (prices === null) {
            return null;
        }
        if (this._private__seriesType === 'Bar' || this._private__seriesType === 'Candlestick' || this._private__seriesType === 'Custom') {
            return {
                _internal_open: prices._internal_value[0 /* PlotRowValueIndex.Open */],
                _internal_high: prices._internal_value[1 /* PlotRowValueIndex.High */],
                _internal_low: prices._internal_value[2 /* PlotRowValueIndex.Low */],
                _internal_close: prices._internal_value[3 /* PlotRowValueIndex.Close */],
            };
        }
        else {
            return prices._internal_value[3 /* PlotRowValueIndex.Close */];
        }
    }
    _internal_topPaneViews(pane) {
        const res = [];
        extractPrimitivePaneViews(this._private__primitives, primitivePaneViewsExtractor, 'top', res);
        const animationPaneView = this._private__lastPriceAnimationPaneView;
        if (animationPaneView === null || !animationPaneView._internal_visible()) {
            return res;
        }
        if (this._private__animationTimeoutId === null && animationPaneView._internal_animationActive()) {
            this._private__animationTimeoutId = setTimeout(() => {
                this._private__animationTimeoutId = null;
                this._internal_model()._internal_cursorUpdate();
            }, 0);
        }
        animationPaneView._internal_invalidateStage();
        res.unshift(animationPaneView);
        return res;
    }
    _internal_paneViews() {
        const res = [];
        if (!this._private__isOverlay()) {
            res.push(this._private__baseHorizontalLineView);
        }
        res.push(this._private__paneView, this._private__priceLineView);
        const priceLineViews = this._private__customPriceLines.map((line) => line._internal_paneView());
        res.push(...priceLineViews);
        extractPrimitivePaneViews(this._private__primitives, primitivePaneViewsExtractor, 'normal', res);
        return res;
    }
    _internal_bottomPaneViews() {
        return this._private__extractPaneViews(primitivePaneViewsExtractor, 'bottom');
    }
    _internal_pricePaneViews(zOrder) {
        return this._private__extractPaneViews(primitivePricePaneViewsExtractor, zOrder);
    }
    _internal_timePaneViews(zOrder) {
        return this._private__extractPaneViews(primitiveTimePaneViewsExtractor, zOrder);
    }
    _internal_primitiveHitTest(x, y) {
        return this._private__primitives
            .map((primitive) => primitive._internal_hitTest(x, y))
            .filter((result) => result !== null);
    }
    _internal_labelPaneViews() {
        return [
            this._private__panePriceAxisView,
            ...this._private__customPriceLines.map((line) => line._internal_labelPaneView()),
        ];
    }
    _internal_priceAxisViews(pane, priceScale) {
        if (priceScale !== this._internal__priceScale && !this._private__isOverlay()) {
            return [];
        }
        const result = [...this._private__priceAxisViews];
        for (const customPriceLine of this._private__customPriceLines) {
            result.push(customPriceLine._internal_priceAxisView());
        }
        this._private__primitives.forEach((wrapper) => {
            result.push(...wrapper._internal_priceAxisViews());
        });
        return result;
    }
    _internal_timeAxisViews() {
        const res = [];
        this._private__primitives.forEach((wrapper) => {
            res.push(...wrapper._internal_timeAxisViews());
        });
        return res;
    }
    _internal_autoscaleInfo(startTimePoint, endTimePoint) {
        if (this._private__options.autoscaleInfoProvider !== undefined) {
            const autoscaleInfo = this._private__options.autoscaleInfoProvider(() => {
                const res = this._private__autoscaleInfoImpl(startTimePoint, endTimePoint);
                return (res === null) ? null : res._internal_toRaw();
            });
            return AutoscaleInfoImpl._internal_fromRaw(autoscaleInfo);
        }
        return this._private__autoscaleInfoImpl(startTimePoint, endTimePoint);
    }
    _internal_minMove() {
        return this._private__options.priceFormat.minMove;
    }
    _internal_formatter() {
        return this._private__formatter;
    }
    _internal_updateAllViews() {
        this._private__paneView._internal_update();
        for (const priceAxisView of this._private__priceAxisViews) {
            priceAxisView._internal_update();
        }
        for (const customPriceLine of this._private__customPriceLines) {
            customPriceLine._internal_update();
        }
        this._private__priceLineView._internal_update();
        this._private__baseHorizontalLineView._internal_update();
        this._private__lastPriceAnimationPaneView?._internal_update();
        this._private__primitives.forEach((wrapper) => wrapper._internal_updateAllViews());
    }
    _internal_priceScale() {
        return ensureNotNull(super._internal_priceScale());
    }
    _internal_markerDataAtIndex(index) {
        const getValue = (this._private__seriesType === 'Line' || this._private__seriesType === 'Area' || this._private__seriesType === 'Baseline') &&
            this._private__options.crosshairMarkerVisible;
        if (!getValue) {
            return null;
        }
        const bar = this._private__data._internal_valueAt(index);
        if (bar === null) {
            return null;
        }
        const price = bar._internal_value[3 /* PlotRowValueIndex.Close */];
        const radius = this._private__markerRadius();
        const borderColor = this._private__markerBorderColor();
        const borderWidth = this._private__markerBorderWidth();
        const backgroundColor = this._private__markerBackgroundColor(index);
        return { _internal_price: price, _internal_radius: radius, _internal_borderColor: borderColor, _internal_borderWidth: borderWidth, _internal_backgroundColor: backgroundColor };
    }
    _internal_title() {
        return this._private__options.title;
    }
    _internal_visible() {
        return this._private__options.visible;
    }
    _internal_attachPrimitive(primitive) {
        this._private__primitives.push(new SeriesPrimitiveWrapper(primitive, this));
    }
    _internal_detachPrimitive(source) {
        this._private__primitives = this._private__primitives.filter((wrapper) => wrapper._internal_primitive() !== source);
    }
    _internal_customSeriesPlotValuesBuilder() {
        if (this._private__seriesType !== 'Custom') {
            return undefined;
        }
        return (data) => {
            return this._private__paneView._internal_priceValueBuilder(data);
        };
    }
    _internal_customSeriesWhitespaceCheck() {
        if (this._private__seriesType !== 'Custom') {
            return undefined;
        }
        return (data) => {
            return this._private__paneView._internal_isWhitespace(data);
        };
    }
    _internal_fulfilledIndices() {
        return this._private__data._internal_indices();
    }
    _private__isOverlay() {
        const priceScale = this._internal_priceScale();
        return !isDefaultPriceScale(priceScale._internal_id());
    }
    _private__autoscaleInfoImpl(startTimePoint, endTimePoint) {
        if (!isInteger(startTimePoint) || !isInteger(endTimePoint) || this._private__data._internal_isEmpty()) {
            return null;
        }
        // TODO: refactor this
        // series data is strongly hardcoded to keep bars
        const plots = this._private__seriesType === 'Line' || this._private__seriesType === 'Area' || this._private__seriesType === 'Baseline' || this._private__seriesType === 'Histogram'
            ? [3 /* PlotRowValueIndex.Close */]
            : [2 /* PlotRowValueIndex.Low */, 1 /* PlotRowValueIndex.High */];
        const barsMinMax = this._private__data._internal_minMaxOnRangeCached(startTimePoint, endTimePoint, plots);
        let range = barsMinMax !== null ? new PriceRangeImpl(barsMinMax._internal_min, barsMinMax._internal_max) : null;
        let margins = null;
        if (this._internal_seriesType() === 'Histogram') {
            const base = this._private__options.base;
            const rangeWithBase = new PriceRangeImpl(base, base);
            range = range !== null ? range._internal_merge(rangeWithBase) : rangeWithBase;
        }
        this._private__primitives.forEach((primitive) => {
            const primitiveAutoscale = primitive._internal_autoscaleInfo(startTimePoint, endTimePoint);
            if (primitiveAutoscale?.priceRange) {
                const primitiveRange = new PriceRangeImpl(primitiveAutoscale.priceRange.minValue, primitiveAutoscale.priceRange.maxValue);
                range = range !== null ? range._internal_merge(primitiveRange) : primitiveRange;
            }
            if (primitiveAutoscale?.margins) {
                margins = primitiveAutoscale.margins;
            }
        });
        return new AutoscaleInfoImpl(range, margins);
    }
    _private__markerRadius() {
        switch (this._private__seriesType) {
            case 'Line':
            case 'Area':
            case 'Baseline':
                return this._private__options.crosshairMarkerRadius;
        }
        return 0;
    }
    _private__markerBorderColor() {
        switch (this._private__seriesType) {
            case 'Line':
            case 'Area':
            case 'Baseline': {
                const crosshairMarkerBorderColor = this._private__options.crosshairMarkerBorderColor;
                if (crosshairMarkerBorderColor.length !== 0) {
                    return crosshairMarkerBorderColor;
                }
            }
        }
        return null;
    }
    _private__markerBorderWidth() {
        switch (this._private__seriesType) {
            case 'Line':
            case 'Area':
            case 'Baseline':
                return this._private__options.crosshairMarkerBorderWidth;
        }
        return 0;
    }
    _private__markerBackgroundColor(index) {
        switch (this._private__seriesType) {
            case 'Line':
            case 'Area':
            case 'Baseline': {
                const crosshairMarkerBackgroundColor = this._private__options.crosshairMarkerBackgroundColor;
                if (crosshairMarkerBackgroundColor.length !== 0) {
                    return crosshairMarkerBackgroundColor;
                }
            }
        }
        return this._internal_barColorer()._internal_barStyle(index)._internal_barColor;
    }
    _private__recreateFormatter() {
        switch (this._private__options.priceFormat.type) {
            case 'custom': {
                this._private__formatter = { format: this._private__options.priceFormat.formatter };
                break;
            }
            case 'volume': {
                this._private__formatter = new VolumeFormatter(this._private__options.priceFormat.precision);
                break;
            }
            case 'percent': {
                this._private__formatter = new PercentageFormatter(this._private__options.priceFormat.precision);
                break;
            }
            default: {
                const priceScale = Math.pow(10, this._private__options.priceFormat.precision);
                this._private__formatter = new PriceFormatter(priceScale, this._private__options.priceFormat.minMove * priceScale);
            }
        }
        if (this._internal__priceScale !== null) {
            this._internal__priceScale._internal_updateFormatter();
        }
    }
    _private__extractPaneViews(extractor, zOrder) {
        const res = [];
        extractPrimitivePaneViews(this._private__primitives, extractor, zOrder, res);
        return res;
    }
}

class Magnet {
    constructor(options) {
        this._private__options = options;
    }
    _internal_align(price, index, pane) {
        let res = price;
        if (this._private__options.mode === 0 /* CrosshairMode.Normal */) {
            return res;
        }
        const defaultPriceScale = pane._internal_defaultPriceScale();
        const firstValue = defaultPriceScale._internal_firstValue();
        if (firstValue === null) {
            return res;
        }
        const y = defaultPriceScale._internal_priceToCoordinate(price, firstValue);
        // get all serieses from the pane
        const serieses = pane._internal_dataSources().filter(((ds) => (ds instanceof Series)));
        const candidates = serieses.reduce((acc, series) => {
            if (pane._internal_isOverlay(series) || !series._internal_visible()) {
                return acc;
            }
            const ps = series._internal_priceScale();
            const bars = series._internal_bars();
            if (ps._internal_isEmpty() || !bars._internal_contains(index)) {
                return acc;
            }
            const bar = bars._internal_valueAt(index);
            if (bar === null) {
                return acc;
            }
            // convert bar to pixels
            const firstPrice = ensure(series._internal_firstValue());
            return acc.concat([ps._internal_priceToCoordinate(bar._internal_value[3 /* PlotRowValueIndex.Close */], firstPrice._internal_value)]);
        }, []);
        if (candidates.length === 0) {
            return res;
        }
        candidates.sort((y1, y2) => Math.abs(y1 - y) - Math.abs(y2 - y));
        const nearest = candidates[0];
        res = defaultPriceScale._internal_coordinateToPrice(nearest, firstValue);
        return res;
    }
}

class GridRenderer extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._private__data = null;
    }
    _internal_setData(data) {
        this._private__data = data;
    }
    _internal__drawImpl({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._private__data === null) {
            return;
        }
        const lineWidth = Math.max(1, Math.floor(horizontalPixelRatio));
        ctx.lineWidth = lineWidth;
        strokeInPixel(ctx, () => {
            const data = ensureNotNull(this._private__data);
            if (data._internal_vertLinesVisible) {
                ctx.strokeStyle = data._internal_vertLinesColor;
                setLineStyle(ctx, data._internal_vertLineStyle);
                ctx.beginPath();
                for (const timeMark of data._internal_timeMarks) {
                    const x = Math.round(timeMark._internal_coord * horizontalPixelRatio);
                    ctx.moveTo(x, -lineWidth);
                    ctx.lineTo(x, bitmapSize.height + lineWidth);
                }
                ctx.stroke();
            }
            if (data._internal_horzLinesVisible) {
                ctx.strokeStyle = data._internal_horzLinesColor;
                setLineStyle(ctx, data._internal_horzLineStyle);
                ctx.beginPath();
                for (const priceMark of data._internal_priceMarks) {
                    const y = Math.round(priceMark._internal_coord * verticalPixelRatio);
                    ctx.moveTo(-lineWidth, y);
                    ctx.lineTo(bitmapSize.width + lineWidth, y);
                }
                ctx.stroke();
            }
        });
    }
}

class GridPaneView {
    constructor(pane) {
        this._private__renderer = new GridRenderer();
        this._private__invalidated = true;
        this._private__pane = pane;
    }
    _internal_update() {
        this._private__invalidated = true;
    }
    _internal_renderer() {
        if (this._private__invalidated) {
            const gridOptions = this._private__pane._internal_model()._internal_options().grid;
            const data = {
                _internal_horzLinesVisible: gridOptions.horzLines.visible,
                _internal_vertLinesVisible: gridOptions.vertLines.visible,
                _internal_horzLinesColor: gridOptions.horzLines.color,
                _internal_vertLinesColor: gridOptions.vertLines.color,
                _internal_horzLineStyle: gridOptions.horzLines.style,
                _internal_vertLineStyle: gridOptions.vertLines.style,
                _internal_priceMarks: this._private__pane._internal_defaultPriceScale()._internal_marks(),
                // need this conversiom because TimeMark is a part of external interface
                // and fields inside TimeMark are not minified
                _internal_timeMarks: (this._private__pane._internal_model()._internal_timeScale()._internal_marks() || []).map((tm) => {
                    return { _internal_coord: tm.coord };
                }),
            };
            this._private__renderer._internal_setData(data);
            this._private__invalidated = false;
        }
        return this._private__renderer;
    }
}

class Grid {
    constructor(pane) {
        this._private__paneView = new GridPaneView(pane);
    }
    _internal_paneView() {
        return this._private__paneView;
    }
}

const defLogFormula = {
    _internal_logicalOffset: 4,
    _internal_coordOffset: 0.0001,
};
function fromPercent(value, baseValue) {
    if (baseValue < 0) {
        value = -value;
    }
    return (value / 100) * baseValue + baseValue;
}
function toPercent(value, baseValue) {
    const result = 100 * (value - baseValue) / baseValue;
    return (baseValue < 0 ? -result : result);
}
function toPercentRange(priceRange, baseValue) {
    const minPercent = toPercent(priceRange._internal_minValue(), baseValue);
    const maxPercent = toPercent(priceRange._internal_maxValue(), baseValue);
    return new PriceRangeImpl(minPercent, maxPercent);
}
function fromIndexedTo100(value, baseValue) {
    value -= 100;
    if (baseValue < 0) {
        value = -value;
    }
    return (value / 100) * baseValue + baseValue;
}
function toIndexedTo100(value, baseValue) {
    const result = 100 * (value - baseValue) / baseValue + 100;
    return (baseValue < 0 ? -result : result);
}
function toIndexedTo100Range(priceRange, baseValue) {
    const minPercent = toIndexedTo100(priceRange._internal_minValue(), baseValue);
    const maxPercent = toIndexedTo100(priceRange._internal_maxValue(), baseValue);
    return new PriceRangeImpl(minPercent, maxPercent);
}
function toLog(price, logFormula) {
    const m = Math.abs(price);
    if (m < 1e-15) {
        return 0;
    }
    const res = Math.log10(m + logFormula._internal_coordOffset) + logFormula._internal_logicalOffset;
    return ((price < 0) ? -res : res);
}
function fromLog(logical, logFormula) {
    const m = Math.abs(logical);
    if (m < 1e-15) {
        return 0;
    }
    const res = Math.pow(10, m - logFormula._internal_logicalOffset) - logFormula._internal_coordOffset;
    return (logical < 0) ? -res : res;
}
function convertPriceRangeToLog(priceRange, logFormula) {
    if (priceRange === null) {
        return null;
    }
    const min = toLog(priceRange._internal_minValue(), logFormula);
    const max = toLog(priceRange._internal_maxValue(), logFormula);
    return new PriceRangeImpl(min, max);
}
function canConvertPriceRangeFromLog(priceRange, logFormula) {
    if (priceRange === null) {
        return false;
    }
    const min = fromLog(priceRange._internal_minValue(), logFormula);
    const max = fromLog(priceRange._internal_maxValue(), logFormula);
    return isFinite(min) && isFinite(max);
}
function convertPriceRangeFromLog(priceRange, logFormula) {
    if (priceRange === null) {
        return null;
    }
    const min = fromLog(priceRange._internal_minValue(), logFormula);
    const max = fromLog(priceRange._internal_maxValue(), logFormula);
    return new PriceRangeImpl(min, max);
}
function logFormulaForPriceRange(range) {
    if (range === null) {
        return defLogFormula;
    }
    const diff = Math.abs(range._internal_maxValue() - range._internal_minValue());
    if (diff >= 1 || diff < 1e-15) {
        return defLogFormula;
    }
    const digits = Math.ceil(Math.abs(Math.log10(diff)));
    const logicalOffset = defLogFormula._internal_logicalOffset + digits;
    const coordOffset = 1 / Math.pow(10, logicalOffset);
    return {
        _internal_logicalOffset: logicalOffset,
        _internal_coordOffset: coordOffset,
    };
}
function logFormulasAreSame(f1, f2) {
    return f1._internal_logicalOffset === f2._internal_logicalOffset && f1._internal_coordOffset === f2._internal_coordOffset;
}

function clamp(value, minVal, maxVal) {
    return Math.min(Math.max(value, minVal), maxVal);
}
function isBaseDecimal(value) {
    if (value < 0) {
        return false;
    }
    for (let current = value; current > 1; current /= 10) {
        if ((current % 10) !== 0) {
            return false;
        }
    }
    return true;
}
function greaterOrEqual(x1, x2, epsilon) {
    return (x2 - x1) <= epsilon;
}
function equal(x1, x2, epsilon) {
    return Math.abs(x1 - x2) < epsilon;
}
// We can't use Math.min(...arr) because that would only support arrays shorter than 65536 items.
function min(arr) {
    if (arr.length < 1) {
        throw Error('array is empty');
    }
    let minVal = arr[0];
    for (let i = 1; i < arr.length; ++i) {
        if (arr[i] < minVal) {
            minVal = arr[i];
        }
    }
    return minVal;
}
function ceiledEven(x) {
    const ceiled = Math.ceil(x);
    return (ceiled % 2 !== 0) ? ceiled - 1 : ceiled;
}
function ceiledOdd(x) {
    const ceiled = Math.ceil(x);
    return (ceiled % 2 === 0) ? ceiled - 1 : ceiled;
}

class PriceTickSpanCalculator {
    constructor(base, integralDividers) {
        this._private__base = base;
        this._private__integralDividers = integralDividers;
        if (isBaseDecimal(this._private__base)) {
            this._private__fractionalDividers = [2, 2.5, 2];
        }
        else {
            this._private__fractionalDividers = [];
            for (let baseRest = this._private__base; baseRest !== 1;) {
                if ((baseRest % 2) === 0) {
                    this._private__fractionalDividers.push(2);
                    baseRest /= 2;
                }
                else if ((baseRest % 5) === 0) {
                    this._private__fractionalDividers.push(2, 2.5);
                    baseRest /= 5;
                }
                else {
                    throw new Error('unexpected base');
                }
                if (this._private__fractionalDividers.length > 100) {
                    throw new Error('something wrong with base');
                }
            }
        }
    }
    _internal_tickSpan(high, low, maxTickSpan) {
        const minMovement = (this._private__base === 0) ? (0) : (1 / this._private__base);
        let resultTickSpan = Math.pow(10, Math.max(0, Math.ceil(Math.log10(high - low))));
        let index = 0;
        let c = this._private__integralDividers[0];
        // eslint-disable-next-line no-constant-condition
        while (true) {
            // the second part is actual for small with very small values like 1e-10
            // greaterOrEqual fails for such values
            const resultTickSpanLargerMinMovement = greaterOrEqual(resultTickSpan, minMovement, 1e-14 /* Constants.TickSpanEpsilon */) && resultTickSpan > (minMovement + 1e-14 /* Constants.TickSpanEpsilon */);
            const resultTickSpanLargerMaxTickSpan = greaterOrEqual(resultTickSpan, maxTickSpan * c, 1e-14 /* Constants.TickSpanEpsilon */);
            const resultTickSpanLarger1 = greaterOrEqual(resultTickSpan, 1, 1e-14 /* Constants.TickSpanEpsilon */);
            const haveToContinue = resultTickSpanLargerMinMovement && resultTickSpanLargerMaxTickSpan && resultTickSpanLarger1;
            if (!haveToContinue) {
                break;
            }
            resultTickSpan /= c;
            c = this._private__integralDividers[++index % this._private__integralDividers.length];
        }
        if (resultTickSpan <= (minMovement + 1e-14 /* Constants.TickSpanEpsilon */)) {
            resultTickSpan = minMovement;
        }
        resultTickSpan = Math.max(1, resultTickSpan);
        if ((this._private__fractionalDividers.length > 0) && equal(resultTickSpan, 1, 1e-14 /* Constants.TickSpanEpsilon */)) {
            index = 0;
            c = this._private__fractionalDividers[0];
            while (greaterOrEqual(resultTickSpan, maxTickSpan * c, 1e-14 /* Constants.TickSpanEpsilon */) && resultTickSpan > (minMovement + 1e-14 /* Constants.TickSpanEpsilon */)) {
                resultTickSpan /= c;
                c = this._private__fractionalDividers[++index % this._private__fractionalDividers.length];
            }
        }
        return resultTickSpan;
    }
}

const TICK_DENSITY = 2.5;
class PriceTickMarkBuilder {
    constructor(priceScale, base, coordinateToLogicalFunc, logicalToCoordinateFunc) {
        this._private__marks = [];
        this._private__priceScale = priceScale;
        this._private__base = base;
        this._private__coordinateToLogicalFunc = coordinateToLogicalFunc;
        this._private__logicalToCoordinateFunc = logicalToCoordinateFunc;
    }
    _internal_tickSpan(high, low) {
        if (high < low) {
            throw new Error('high < low');
        }
        const scaleHeight = this._private__priceScale._internal_height();
        const markHeight = this._private__tickMarkHeight();
        const maxTickSpan = (high - low) * markHeight / scaleHeight;
        const spanCalculator1 = new PriceTickSpanCalculator(this._private__base, [2, 2.5, 2]);
        const spanCalculator2 = new PriceTickSpanCalculator(this._private__base, [2, 2, 2.5]);
        const spanCalculator3 = new PriceTickSpanCalculator(this._private__base, [2.5, 2, 2]);
        const spans = [];
        spans.push(spanCalculator1._internal_tickSpan(high, low, maxTickSpan), spanCalculator2._internal_tickSpan(high, low, maxTickSpan), spanCalculator3._internal_tickSpan(high, low, maxTickSpan));
        return min(spans);
    }
    _internal_rebuildTickMarks() {
        const priceScale = this._private__priceScale;
        const firstValue = priceScale._internal_firstValue();
        if (firstValue === null) {
            this._private__marks = [];
            return;
        }
        const scaleHeight = priceScale._internal_height();
        const bottom = this._private__coordinateToLogicalFunc(scaleHeight - 1, firstValue);
        const top = this._private__coordinateToLogicalFunc(0, firstValue);
        const extraTopBottomMargin = this._private__priceScale._internal_options().entireTextOnly ? this._private__fontHeight() / 2 : 0;
        const minCoord = extraTopBottomMargin;
        const maxCoord = scaleHeight - 1 - extraTopBottomMargin;
        const high = Math.max(bottom, top);
        const low = Math.min(bottom, top);
        if (high === low) {
            this._private__marks = [];
            return;
        }
        let span = this._internal_tickSpan(high, low);
        let mod = high % span;
        mod += mod < 0 ? span : 0;
        const sign = (high >= low) ? 1 : -1;
        let prevCoord = null;
        let targetIndex = 0;
        for (let logical = high - mod; logical > low; logical -= span) {
            const coord = this._private__logicalToCoordinateFunc(logical, firstValue, true);
            // check if there is place for it
            // this is required for log scale
            if (prevCoord !== null && Math.abs(coord - prevCoord) < this._private__tickMarkHeight()) {
                continue;
            }
            // check if a tick mark is partially visible and skip it if entireTextOnly is true
            if (coord < minCoord || coord > maxCoord) {
                continue;
            }
            if (targetIndex < this._private__marks.length) {
                this._private__marks[targetIndex]._internal_coord = coord;
                this._private__marks[targetIndex]._internal_label = priceScale._internal_formatLogical(logical);
            }
            else {
                this._private__marks.push({
                    _internal_coord: coord,
                    _internal_label: priceScale._internal_formatLogical(logical),
                });
            }
            targetIndex++;
            prevCoord = coord;
            if (priceScale._internal_isLog()) {
                // recalc span
                span = this._internal_tickSpan(logical * sign, low);
            }
        }
        this._private__marks.length = targetIndex;
    }
    _internal_marks() {
        return this._private__marks;
    }
    _private__fontHeight() {
        return this._private__priceScale._internal_fontSize();
    }
    _private__tickMarkHeight() {
        return Math.ceil(this._private__fontHeight() * TICK_DENSITY);
    }
}

function sortSources(sources) {
    return sources.slice().sort((s1, s2) => {
        return (ensureNotNull(s1._internal_zorder()) - ensureNotNull(s2._internal_zorder()));
    });
}

/**
 * Represents the price scale mode.
 */
var PriceScaleMode;
(function (PriceScaleMode) {
    /**
     * Price scale shows prices. Price range changes linearly.
     */
    PriceScaleMode[PriceScaleMode["Normal"] = 0] = "Normal";
    /**
     * Price scale shows prices. Price range changes logarithmically.
     */
    PriceScaleMode[PriceScaleMode["Logarithmic"] = 1] = "Logarithmic";
    /**
     * Price scale shows percentage values according the first visible value of the price scale.
     * The first visible value is 0% in this mode.
     */
    PriceScaleMode[PriceScaleMode["Percentage"] = 2] = "Percentage";
    /**
     * The same as percentage mode, but the first value is moved to 100.
     */
    PriceScaleMode[PriceScaleMode["IndexedTo100"] = 3] = "IndexedTo100";
})(PriceScaleMode || (PriceScaleMode = {}));
const percentageFormatter = new PercentageFormatter();
const defaultPriceFormatter = new PriceFormatter(100, 1);
class PriceScale {
    constructor(id, options, layoutOptions, localizationOptions, colorParser) {
        this._private__height = 0;
        this._private__internalHeightCache = null;
        this._private__priceRange = null;
        this._private__priceRangeSnapshot = null;
        this._private__invalidatedForRange = { _internal_isValid: false, _internal_visibleBars: null };
        this._private__marginAbove = 0;
        this._private__marginBelow = 0;
        this._private__onMarksChanged = new Delegate();
        this._private__modeChanged = new Delegate();
        this._private__dataSources = [];
        this._private__cachedOrderedSources = null;
        this._private__marksCache = null;
        this._private__scaleStartPoint = null;
        this._private__scrollStartPoint = null;
        this._private__formatter = defaultPriceFormatter;
        this._private__logFormula = logFormulaForPriceRange(null);
        this._private__id = id;
        this._private__options = options;
        this._private__layoutOptions = layoutOptions;
        this._private__localizationOptions = localizationOptions;
        this._private__colorParser = colorParser;
        this._private__markBuilder = new PriceTickMarkBuilder(this, 100, this._private__coordinateToLogical.bind(this), this._private__logicalToCoordinate.bind(this));
    }
    _internal_id() {
        return this._private__id;
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_applyOptions(options) {
        merge(this._private__options, options);
        this._internal_updateFormatter();
        if (options.mode !== undefined) {
            this._internal_setMode({ _internal_mode: options.mode });
        }
        if (options.scaleMargins !== undefined) {
            const top = ensureDefined(options.scaleMargins.top);
            const bottom = ensureDefined(options.scaleMargins.bottom);
            if (top < 0 || top > 1) {
                throw new Error(`Invalid top margin - expect value between 0 and 1, given=${top}`);
            }
            if (bottom < 0 || bottom > 1) {
                throw new Error(`Invalid bottom margin - expect value between 0 and 1, given=${bottom}`);
            }
            if (top + bottom > 1) {
                throw new Error(`Invalid margins - sum of margins must be less than 1, given=${top + bottom}`);
            }
            this._private__invalidateInternalHeightCache();
            this._private__marksCache = null;
        }
    }
    _internal_isAutoScale() {
        return this._private__options.autoScale;
    }
    _internal_isLog() {
        return this._private__options.mode === 1 /* PriceScaleMode.Logarithmic */;
    }
    _internal_isPercentage() {
        return this._private__options.mode === 2 /* PriceScaleMode.Percentage */;
    }
    _internal_isIndexedTo100() {
        return this._private__options.mode === 3 /* PriceScaleMode.IndexedTo100 */;
    }
    _internal_mode() {
        return {
            _internal_autoScale: this._private__options.autoScale,
            _internal_isInverted: this._private__options.invertScale,
            _internal_mode: this._private__options.mode,
        };
    }
    // eslint-disable-next-line complexity
    _internal_setMode(newMode) {
        const oldMode = this._internal_mode();
        let priceRange = null;
        if (newMode._internal_autoScale !== undefined) {
            this._private__options.autoScale = newMode._internal_autoScale;
        }
        if (newMode._internal_mode !== undefined) {
            this._private__options.mode = newMode._internal_mode;
            if (newMode._internal_mode === 2 /* PriceScaleMode.Percentage */ || newMode._internal_mode === 3 /* PriceScaleMode.IndexedTo100 */) {
                this._private__options.autoScale = true;
            }
            // TODO: Remove after making rebuildTickMarks lazy
            this._private__invalidatedForRange._internal_isValid = false;
        }
        // define which scale converted from
        if (oldMode._internal_mode === 1 /* PriceScaleMode.Logarithmic */ && newMode._internal_mode !== oldMode._internal_mode) {
            if (canConvertPriceRangeFromLog(this._private__priceRange, this._private__logFormula)) {
                priceRange = convertPriceRangeFromLog(this._private__priceRange, this._private__logFormula);
                if (priceRange !== null) {
                    this._internal_setPriceRange(priceRange);
                }
            }
            else {
                this._private__options.autoScale = true;
            }
        }
        // define which scale converted to
        if (newMode._internal_mode === 1 /* PriceScaleMode.Logarithmic */ && newMode._internal_mode !== oldMode._internal_mode) {
            priceRange = convertPriceRangeToLog(this._private__priceRange, this._private__logFormula);
            if (priceRange !== null) {
                this._internal_setPriceRange(priceRange);
            }
        }
        const modeChanged = oldMode._internal_mode !== this._private__options.mode;
        if (modeChanged && (oldMode._internal_mode === 2 /* PriceScaleMode.Percentage */ || this._internal_isPercentage())) {
            this._internal_updateFormatter();
        }
        if (modeChanged && (oldMode._internal_mode === 3 /* PriceScaleMode.IndexedTo100 */ || this._internal_isIndexedTo100())) {
            this._internal_updateFormatter();
        }
        if (newMode._internal_isInverted !== undefined && oldMode._internal_isInverted !== newMode._internal_isInverted) {
            this._private__options.invertScale = newMode._internal_isInverted;
            this._private__onIsInvertedChanged();
        }
        this._private__modeChanged._internal_fire(oldMode, this._internal_mode());
    }
    _internal_modeChanged() {
        return this._private__modeChanged;
    }
    _internal_fontSize() {
        return this._private__layoutOptions.fontSize;
    }
    _internal_height() {
        return this._private__height;
    }
    _internal_setHeight(value) {
        if (this._private__height === value) {
            return;
        }
        this._private__height = value;
        this._private__invalidateInternalHeightCache();
        this._private__marksCache = null;
    }
    _internal_internalHeight() {
        if (this._private__internalHeightCache) {
            return this._private__internalHeightCache;
        }
        const res = this._internal_height() - this._private__topMarginPx() - this._private__bottomMarginPx();
        this._private__internalHeightCache = res;
        return res;
    }
    _internal_priceRange() {
        this._private__makeSureItIsValid();
        return this._private__priceRange;
    }
    _internal_setPriceRange(newPriceRange, isForceSetValue) {
        const oldPriceRange = this._private__priceRange;
        if (!isForceSetValue &&
            !(oldPriceRange === null && newPriceRange !== null) &&
            (oldPriceRange === null || oldPriceRange._internal_equals(newPriceRange))) {
            return;
        }
        this._private__marksCache = null;
        this._private__priceRange = newPriceRange;
    }
    _internal_isEmpty() {
        this._private__makeSureItIsValid();
        return this._private__height === 0 || !this._private__priceRange || this._private__priceRange._internal_isEmpty();
    }
    _internal_invertedCoordinate(coordinate) {
        return this._internal_isInverted() ? coordinate : this._internal_height() - 1 - coordinate;
    }
    _internal_priceToCoordinate(price, baseValue) {
        if (this._internal_isPercentage()) {
            price = toPercent(price, baseValue);
        }
        else if (this._internal_isIndexedTo100()) {
            price = toIndexedTo100(price, baseValue);
        }
        return this._private__logicalToCoordinate(price, baseValue);
    }
    _internal_pointsArrayToCoordinates(points, baseValue, visibleRange) {
        this._private__makeSureItIsValid();
        const bh = this._private__bottomMarginPx();
        const range = ensureNotNull(this._internal_priceRange());
        const min = range._internal_minValue();
        const max = range._internal_maxValue();
        const ih = (this._internal_internalHeight() - 1);
        const isInverted = this._internal_isInverted();
        const hmm = ih / (max - min);
        const fromIndex = (visibleRange === undefined) ? 0 : visibleRange.from;
        const toIndex = (visibleRange === undefined) ? points.length : visibleRange.to;
        const transformFn = this._private__getCoordinateTransformer();
        for (let i = fromIndex; i < toIndex; i++) {
            const point = points[i];
            const price = point._internal_price;
            if (isNaN(price)) {
                continue;
            }
            let logical = price;
            if (transformFn !== null) {
                logical = transformFn(point._internal_price, baseValue);
            }
            const invCoordinate = bh + hmm * (logical - min);
            const coordinate = isInverted ? invCoordinate : this._private__height - 1 - invCoordinate;
            point._internal_y = coordinate;
        }
    }
    _internal_barPricesToCoordinates(pricesList, baseValue, visibleRange) {
        this._private__makeSureItIsValid();
        const bh = this._private__bottomMarginPx();
        const range = ensureNotNull(this._internal_priceRange());
        const min = range._internal_minValue();
        const max = range._internal_maxValue();
        const ih = (this._internal_internalHeight() - 1);
        const isInverted = this._internal_isInverted();
        const hmm = ih / (max - min);
        const fromIndex = (visibleRange === undefined) ? 0 : visibleRange.from;
        const toIndex = (visibleRange === undefined) ? pricesList.length : visibleRange.to;
        const transformFn = this._private__getCoordinateTransformer();
        for (let i = fromIndex; i < toIndex; i++) {
            const bar = pricesList[i];
            let openLogical = bar._internal_open;
            let highLogical = bar._internal_high;
            let lowLogical = bar._internal_low;
            let closeLogical = bar._internal_close;
            if (transformFn !== null) {
                openLogical = transformFn(bar._internal_open, baseValue);
                highLogical = transformFn(bar._internal_high, baseValue);
                lowLogical = transformFn(bar._internal_low, baseValue);
                closeLogical = transformFn(bar._internal_close, baseValue);
            }
            let invCoordinate = bh + hmm * (openLogical - min);
            let coordinate = isInverted ? invCoordinate : this._private__height - 1 - invCoordinate;
            bar._internal_openY = coordinate;
            invCoordinate = bh + hmm * (highLogical - min);
            coordinate = isInverted ? invCoordinate : this._private__height - 1 - invCoordinate;
            bar._internal_highY = coordinate;
            invCoordinate = bh + hmm * (lowLogical - min);
            coordinate = isInverted ? invCoordinate : this._private__height - 1 - invCoordinate;
            bar._internal_lowY = coordinate;
            invCoordinate = bh + hmm * (closeLogical - min);
            coordinate = isInverted ? invCoordinate : this._private__height - 1 - invCoordinate;
            bar._internal_closeY = coordinate;
        }
    }
    _internal_coordinateToPrice(coordinate, baseValue) {
        const logical = this._private__coordinateToLogical(coordinate, baseValue);
        return this._internal_logicalToPrice(logical, baseValue);
    }
    _internal_logicalToPrice(logical, baseValue) {
        let value = logical;
        if (this._internal_isPercentage()) {
            value = fromPercent(value, baseValue);
        }
        else if (this._internal_isIndexedTo100()) {
            value = fromIndexedTo100(value, baseValue);
        }
        return value;
    }
    _internal_dataSources() {
        return this._private__dataSources;
    }
    _internal_orderedSources() {
        if (this._private__cachedOrderedSources) {
            return this._private__cachedOrderedSources;
        }
        let sources = [];
        for (let i = 0; i < this._private__dataSources.length; i++) {
            const ds = this._private__dataSources[i];
            if (ds._internal_zorder() === null) {
                ds._internal_setZorder(i + 1);
            }
            sources.push(ds);
        }
        sources = sortSources(sources);
        this._private__cachedOrderedSources = sources;
        return this._private__cachedOrderedSources;
    }
    _internal_addDataSource(source) {
        if (this._private__dataSources.indexOf(source) !== -1) {
            return;
        }
        this._private__dataSources.push(source);
        this._internal_updateFormatter();
        this._internal_invalidateSourcesCache();
    }
    _internal_removeDataSource(source) {
        const index = this._private__dataSources.indexOf(source);
        if (index === -1) {
            throw new Error('source is not attached to scale');
        }
        this._private__dataSources.splice(index, 1);
        if (this._private__dataSources.length === 0) {
            this._internal_setMode({
                _internal_autoScale: true,
            });
            // if no sources on price scale let's clear price range cache as well as enabling auto scale
            this._internal_setPriceRange(null);
        }
        this._internal_updateFormatter();
        this._internal_invalidateSourcesCache();
    }
    _internal_firstValue() {
        // TODO: cache the result
        let result = null;
        for (const source of this._private__dataSources) {
            const firstValue = source._internal_firstValue();
            if (firstValue === null) {
                continue;
            }
            if (result === null || firstValue._internal_timePoint < result._internal_timePoint) {
                result = firstValue;
            }
        }
        return result === null ? null : result._internal_value;
    }
    _internal_isInverted() {
        return this._private__options.invertScale;
    }
    _internal_marks() {
        const firstValueIsNull = this._internal_firstValue() === null;
        // do not recalculate marks if firstValueIsNull is true because in this case we'll always get empty result
        // this could happen in case when a series had some data and then you set empty data to it (in a simplified case)
        // we could display an empty price scale, but this is not good from UX
        // so in this case we need to keep an previous marks to display them on the scale
        // as one of possible examples for this situation could be the following:
        // let's say you have a study/indicator attached to a price scale and then you decide to stop it, i.e. remove its data because of its visibility
        // a user will see the previous marks on the scale until you turn on your study back or remove it from the chart completely
        if (this._private__marksCache !== null && (firstValueIsNull || this._private__marksCache._internal_firstValueIsNull === firstValueIsNull)) {
            return this._private__marksCache._internal_marks;
        }
        this._private__markBuilder._internal_rebuildTickMarks();
        const marks = this._private__markBuilder._internal_marks();
        this._private__marksCache = { _internal_marks: marks, _internal_firstValueIsNull: firstValueIsNull };
        this._private__onMarksChanged._internal_fire();
        return marks;
    }
    _internal_onMarksChanged() {
        return this._private__onMarksChanged;
    }
    _internal_startScale(x) {
        if (this._internal_isPercentage() || this._internal_isIndexedTo100()) {
            return;
        }
        if (this._private__scaleStartPoint !== null || this._private__priceRangeSnapshot !== null) {
            return;
        }
        if (this._internal_isEmpty()) {
            return;
        }
        // invert x
        this._private__scaleStartPoint = this._private__height - x;
        this._private__priceRangeSnapshot = ensureNotNull(this._internal_priceRange())._internal_clone();
    }
    _internal_scaleTo(x) {
        if (this._internal_isPercentage() || this._internal_isIndexedTo100()) {
            return;
        }
        if (this._private__scaleStartPoint === null) {
            return;
        }
        this._internal_setMode({
            _internal_autoScale: false,
        });
        // invert x
        x = this._private__height - x;
        if (x < 0) {
            x = 0;
        }
        let scaleCoeff = (this._private__scaleStartPoint + (this._private__height - 1) * 0.2) / (x + (this._private__height - 1) * 0.2);
        const newPriceRange = ensureNotNull(this._private__priceRangeSnapshot)._internal_clone();
        scaleCoeff = Math.max(scaleCoeff, 0.1);
        newPriceRange._internal_scaleAroundCenter(scaleCoeff);
        this._internal_setPriceRange(newPriceRange);
    }
    _internal_endScale() {
        if (this._internal_isPercentage() || this._internal_isIndexedTo100()) {
            return;
        }
        this._private__scaleStartPoint = null;
        this._private__priceRangeSnapshot = null;
    }
    _internal_startScroll(x) {
        if (this._internal_isAutoScale()) {
            return;
        }
        if (this._private__scrollStartPoint !== null || this._private__priceRangeSnapshot !== null) {
            return;
        }
        if (this._internal_isEmpty()) {
            return;
        }
        this._private__scrollStartPoint = x;
        this._private__priceRangeSnapshot = ensureNotNull(this._internal_priceRange())._internal_clone();
    }
    _internal_scrollTo(x) {
        if (this._internal_isAutoScale()) {
            return;
        }
        if (this._private__scrollStartPoint === null) {
            return;
        }
        const priceUnitsPerPixel = ensureNotNull(this._internal_priceRange())._internal_length() / (this._internal_internalHeight() - 1);
        let pixelDelta = x - this._private__scrollStartPoint;
        if (this._internal_isInverted()) {
            pixelDelta *= -1;
        }
        const priceDelta = pixelDelta * priceUnitsPerPixel;
        const newPriceRange = ensureNotNull(this._private__priceRangeSnapshot)._internal_clone();
        newPriceRange._internal_shift(priceDelta);
        this._internal_setPriceRange(newPriceRange, true);
        this._private__marksCache = null;
    }
    _internal_endScroll() {
        if (this._internal_isAutoScale()) {
            return;
        }
        if (this._private__scrollStartPoint === null) {
            return;
        }
        this._private__scrollStartPoint = null;
        this._private__priceRangeSnapshot = null;
    }
    _internal_formatter() {
        if (!this._private__formatter) {
            this._internal_updateFormatter();
        }
        return this._private__formatter;
    }
    _internal_formatPrice(price, firstValue) {
        switch (this._private__options.mode) {
            case 2 /* PriceScaleMode.Percentage */:
                return this._private__formatPercentage(toPercent(price, firstValue));
            case 3 /* PriceScaleMode.IndexedTo100 */:
                return this._internal_formatter().format(toIndexedTo100(price, firstValue));
            default:
                return this._private__formatPrice(price);
        }
    }
    _internal_formatLogical(logical) {
        switch (this._private__options.mode) {
            case 2 /* PriceScaleMode.Percentage */:
                return this._private__formatPercentage(logical);
            case 3 /* PriceScaleMode.IndexedTo100 */:
                return this._internal_formatter().format(logical);
            default:
                return this._private__formatPrice(logical);
        }
    }
    _internal_formatPriceAbsolute(price) {
        return this._private__formatPrice(price, ensureNotNull(this._private__formatterSource())._internal_formatter());
    }
    _internal_formatPricePercentage(price, baseValue) {
        price = toPercent(price, baseValue);
        return this._private__formatPercentage(price, percentageFormatter);
    }
    _internal_sourcesForAutoScale() {
        return this._private__dataSources;
    }
    _internal_recalculatePriceRange(visibleBars) {
        this._private__invalidatedForRange = {
            _internal_visibleBars: visibleBars,
            _internal_isValid: false,
        };
    }
    _internal_updateAllViews() {
        this._private__dataSources.forEach((s) => s._internal_updateAllViews());
    }
    _internal_updateFormatter() {
        this._private__marksCache = null;
        const formatterSource = this._private__formatterSource();
        let base = 100;
        if (formatterSource !== null) {
            base = Math.round(1 / formatterSource._internal_minMove());
        }
        this._private__formatter = defaultPriceFormatter;
        if (this._internal_isPercentage()) {
            this._private__formatter = percentageFormatter;
            base = 100;
        }
        else if (this._internal_isIndexedTo100()) {
            this._private__formatter = new PriceFormatter(100, 1);
            base = 100;
        }
        else {
            if (formatterSource !== null) {
                // user
                this._private__formatter = formatterSource._internal_formatter();
            }
        }
        this._private__markBuilder = new PriceTickMarkBuilder(this, base, this._private__coordinateToLogical.bind(this), this._private__logicalToCoordinate.bind(this));
        this._private__markBuilder._internal_rebuildTickMarks();
    }
    _internal_invalidateSourcesCache() {
        this._private__cachedOrderedSources = null;
    }
    _internal_colorParser() {
        return this._private__colorParser;
    }
    /**
     * @returns The {@link IPriceDataSource} that will be used as the "formatter source" (take minMove for formatter).
     */
    _private__formatterSource() {
        return this._private__dataSources[0] || null;
    }
    _private__topMarginPx() {
        return this._internal_isInverted()
            ? this._private__options.scaleMargins.bottom * this._internal_height() + this._private__marginBelow
            : this._private__options.scaleMargins.top * this._internal_height() + this._private__marginAbove;
    }
    _private__bottomMarginPx() {
        return this._internal_isInverted()
            ? this._private__options.scaleMargins.top * this._internal_height() + this._private__marginAbove
            : this._private__options.scaleMargins.bottom * this._internal_height() + this._private__marginBelow;
    }
    _private__makeSureItIsValid() {
        if (!this._private__invalidatedForRange._internal_isValid) {
            this._private__invalidatedForRange._internal_isValid = true;
            this._private__recalculatePriceRangeImpl();
        }
    }
    _private__invalidateInternalHeightCache() {
        this._private__internalHeightCache = null;
    }
    _private__logicalToCoordinate(logical, baseValue) {
        this._private__makeSureItIsValid();
        if (this._internal_isEmpty()) {
            return 0;
        }
        logical = this._internal_isLog() && logical ? toLog(logical, this._private__logFormula) : logical;
        const range = ensureNotNull(this._internal_priceRange());
        const invCoordinate = this._private__bottomMarginPx() +
            (this._internal_internalHeight() - 1) * (logical - range._internal_minValue()) / range._internal_length();
        const coordinate = this._internal_invertedCoordinate(invCoordinate);
        return coordinate;
    }
    _private__coordinateToLogical(coordinate, baseValue) {
        this._private__makeSureItIsValid();
        if (this._internal_isEmpty()) {
            return 0;
        }
        const invCoordinate = this._internal_invertedCoordinate(coordinate);
        const range = ensureNotNull(this._internal_priceRange());
        const logical = range._internal_minValue() + range._internal_length() *
            ((invCoordinate - this._private__bottomMarginPx()) / (this._internal_internalHeight() - 1));
        return this._internal_isLog() ? fromLog(logical, this._private__logFormula) : logical;
    }
    _private__onIsInvertedChanged() {
        this._private__marksCache = null;
        this._private__markBuilder._internal_rebuildTickMarks();
    }
    // eslint-disable-next-line complexity
    _private__recalculatePriceRangeImpl() {
        const visibleBars = this._private__invalidatedForRange._internal_visibleBars;
        if (visibleBars === null) {
            return;
        }
        let priceRange = null;
        const sources = this._internal_sourcesForAutoScale();
        let marginAbove = 0;
        let marginBelow = 0;
        for (const source of sources) {
            if (!source._internal_visible()) {
                continue;
            }
            const firstValue = source._internal_firstValue();
            if (firstValue === null) {
                continue;
            }
            const autoScaleInfo = source._internal_autoscaleInfo(visibleBars._internal_left(), visibleBars._internal_right());
            let sourceRange = autoScaleInfo && autoScaleInfo._internal_priceRange();
            if (sourceRange !== null) {
                switch (this._private__options.mode) {
                    case 1 /* PriceScaleMode.Logarithmic */:
                        sourceRange = convertPriceRangeToLog(sourceRange, this._private__logFormula);
                        break;
                    case 2 /* PriceScaleMode.Percentage */:
                        sourceRange = toPercentRange(sourceRange, firstValue._internal_value);
                        break;
                    case 3 /* PriceScaleMode.IndexedTo100 */:
                        sourceRange = toIndexedTo100Range(sourceRange, firstValue._internal_value);
                        break;
                }
                if (priceRange === null) {
                    priceRange = sourceRange;
                }
                else {
                    priceRange = priceRange._internal_merge(ensureNotNull(sourceRange));
                }
                if (autoScaleInfo !== null) {
                    const margins = autoScaleInfo._internal_margins();
                    if (margins !== null) {
                        marginAbove = Math.max(marginAbove, margins.above);
                        marginBelow = Math.max(marginBelow, margins.below);
                    }
                }
            }
        }
        if (marginAbove !== this._private__marginAbove || marginBelow !== this._private__marginBelow) {
            this._private__marginAbove = marginAbove;
            this._private__marginBelow = marginBelow;
            this._private__marksCache = null;
            this._private__invalidateInternalHeightCache();
        }
        if (priceRange !== null) {
            // keep current range is new is empty
            if (priceRange._internal_minValue() === priceRange._internal_maxValue()) {
                const formatterSource = this._private__formatterSource();
                const minMove = formatterSource === null || this._internal_isPercentage() || this._internal_isIndexedTo100() ? 1 : formatterSource._internal_minMove();
                // if price range is degenerated to 1 point let's extend it by 10 min move values
                // to avoid incorrect range and empty (blank) scale (in case of min tick much greater than 1)
                const extendValue = 5 * minMove;
                if (this._internal_isLog()) {
                    priceRange = convertPriceRangeFromLog(priceRange, this._private__logFormula);
                }
                priceRange = new PriceRangeImpl(priceRange._internal_minValue() - extendValue, priceRange._internal_maxValue() + extendValue);
                if (this._internal_isLog()) {
                    priceRange = convertPriceRangeToLog(priceRange, this._private__logFormula);
                }
            }
            if (this._internal_isLog()) {
                const rawRange = convertPriceRangeFromLog(priceRange, this._private__logFormula);
                const newLogFormula = logFormulaForPriceRange(rawRange);
                if (!logFormulasAreSame(newLogFormula, this._private__logFormula)) {
                    const rawSnapshot = this._private__priceRangeSnapshot !== null ? convertPriceRangeFromLog(this._private__priceRangeSnapshot, this._private__logFormula) : null;
                    this._private__logFormula = newLogFormula;
                    priceRange = convertPriceRangeToLog(rawRange, newLogFormula);
                    if (rawSnapshot !== null) {
                        this._private__priceRangeSnapshot = convertPriceRangeToLog(rawSnapshot, newLogFormula);
                    }
                }
            }
            this._internal_setPriceRange(priceRange);
        }
        else {
            // reset empty to default
            if (this._private__priceRange === null) {
                this._internal_setPriceRange(new PriceRangeImpl(-0.5, 0.5));
                this._private__logFormula = logFormulaForPriceRange(null);
            }
        }
        this._private__invalidatedForRange._internal_isValid = true;
    }
    _private__getCoordinateTransformer() {
        if (this._internal_isPercentage()) {
            return toPercent;
        }
        else if (this._internal_isIndexedTo100()) {
            return toIndexedTo100;
        }
        else if (this._internal_isLog()) {
            return (price) => toLog(price, this._private__logFormula);
        }
        return null;
    }
    _private__formatValue(value, formatter, fallbackFormatter) {
        if (formatter === undefined) {
            if (fallbackFormatter === undefined) {
                fallbackFormatter = this._internal_formatter();
            }
            return fallbackFormatter.format(value);
        }
        return formatter(value);
    }
    _private__formatPrice(price, fallbackFormatter) {
        return this._private__formatValue(price, this._private__localizationOptions.priceFormatter, fallbackFormatter);
    }
    _private__formatPercentage(percentage, fallbackFormatter) {
        return this._private__formatValue(percentage, this._private__localizationOptions.percentageFormatter, fallbackFormatter);
    }
}

function isSeries(source) {
    return source instanceof Series;
}
const DEFAULT_STRETCH_FACTOR = 1000;
const MIN_PANE_HEIGHT = 30;
class Pane {
    constructor(timeScale, model) {
        this._private__dataSources = [];
        this._private__overlaySourcesByScaleId = new Map();
        this._private__height = 0;
        this._private__width = 0;
        this._private__stretchFactor = DEFAULT_STRETCH_FACTOR;
        this._private__cachedOrderedSources = null;
        this._private__destroyed = new Delegate();
        this._private__primitives = [];
        this._private__timeScale = timeScale;
        this._private__model = model;
        this._private__grid = new Grid(this);
        const options = model._internal_options();
        this._private__leftPriceScale = this._private__createPriceScale("left" /* DefaultPriceScaleId.Left */, options.leftPriceScale);
        this._private__rightPriceScale = this._private__createPriceScale("right" /* DefaultPriceScaleId.Right */, options.rightPriceScale);
        this._private__leftPriceScale._internal_modeChanged()._internal_subscribe(this._private__onPriceScaleModeChanged.bind(this, this._private__leftPriceScale), this);
        this._private__rightPriceScale._internal_modeChanged()._internal_subscribe(this._private__onPriceScaleModeChanged.bind(this, this._private__rightPriceScale), this);
        this._internal_applyScaleOptions(options);
    }
    _internal_applyScaleOptions(options) {
        if (options.leftPriceScale) {
            this._private__leftPriceScale._internal_applyOptions(options.leftPriceScale);
        }
        if (options.rightPriceScale) {
            this._private__rightPriceScale._internal_applyOptions(options.rightPriceScale);
        }
        if (options.localization) {
            this._private__leftPriceScale._internal_updateFormatter();
            this._private__rightPriceScale._internal_updateFormatter();
        }
        if (options.overlayPriceScales) {
            const sourceArrays = Array.from(this._private__overlaySourcesByScaleId.values());
            for (const arr of sourceArrays) {
                const priceScale = ensureNotNull(arr[0]._internal_priceScale());
                priceScale._internal_applyOptions(options.overlayPriceScales);
                if (options.localization) {
                    priceScale._internal_updateFormatter();
                }
            }
        }
    }
    _internal_priceScaleById(id) {
        switch (id) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            case "left" /* DefaultPriceScaleId.Left */: {
                return this._private__leftPriceScale;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            case "right" /* DefaultPriceScaleId.Right */: {
                return this._private__rightPriceScale;
            }
        }
        if (this._private__overlaySourcesByScaleId.has(id)) {
            return ensureDefined(this._private__overlaySourcesByScaleId.get(id))[0]._internal_priceScale();
        }
        return null;
    }
    _internal_destroy() {
        this._internal_model()._internal_priceScalesOptionsChanged()._internal_unsubscribeAll(this);
        this._private__leftPriceScale._internal_modeChanged()._internal_unsubscribeAll(this);
        this._private__rightPriceScale._internal_modeChanged()._internal_unsubscribeAll(this);
        this._private__dataSources.forEach((source) => {
            if (source._internal_destroy) {
                source._internal_destroy();
            }
        });
        this._private__primitives = this._private__primitives.filter((primitive) => {
            const p = primitive._internal_primitive();
            if (p.detached) {
                p.detached();
            }
            return false;
        });
        this._private__destroyed._internal_fire();
    }
    _internal_stretchFactor() {
        return this._private__stretchFactor;
    }
    _internal_setStretchFactor(factor) {
        this._private__stretchFactor = factor;
    }
    _internal_model() {
        return this._private__model;
    }
    _internal_width() {
        return this._private__width;
    }
    _internal_height() {
        return this._private__height;
    }
    _internal_setWidth(width) {
        this._private__width = width;
        this._internal_updateAllSources();
    }
    _internal_setHeight(height) {
        this._private__height = height;
        this._private__leftPriceScale._internal_setHeight(height);
        this._private__rightPriceScale._internal_setHeight(height);
        // process overlays
        this._private__dataSources.forEach((ds) => {
            if (this._internal_isOverlay(ds)) {
                const priceScale = ds._internal_priceScale();
                if (priceScale !== null) {
                    priceScale._internal_setHeight(height);
                }
            }
        });
        this._internal_updateAllSources();
    }
    _internal_series() {
        return this._private__dataSources.filter(isSeries);
    }
    _internal_dataSources() {
        return this._private__dataSources;
    }
    _internal_isOverlay(source) {
        const priceScale = source._internal_priceScale();
        if (priceScale === null) {
            return true;
        }
        return this._private__leftPriceScale !== priceScale && this._private__rightPriceScale !== priceScale;
    }
    _internal_addDataSource(source, targetScaleId, zOrder) {
        const targetZOrder = (zOrder !== undefined) ? zOrder : this._private__getZOrderMinMax()._internal_maxZOrder + 1;
        this._private__insertDataSource(source, targetScaleId, targetZOrder);
    }
    _internal_removeDataSource(source) {
        const index = this._private__dataSources.indexOf(source);
        assert(index !== -1, 'removeDataSource: invalid data source');
        this._private__dataSources.splice(index, 1);
        const priceScaleId = ensureNotNull(source._internal_priceScale())._internal_id();
        if (this._private__overlaySourcesByScaleId.has(priceScaleId)) {
            const overlaySources = ensureDefined(this._private__overlaySourcesByScaleId.get(priceScaleId));
            const overlayIndex = overlaySources.indexOf(source);
            if (overlayIndex !== -1) {
                overlaySources.splice(overlayIndex, 1);
                if (overlaySources.length === 0) {
                    this._private__overlaySourcesByScaleId.delete(priceScaleId);
                }
            }
        }
        const priceScale = source._internal_priceScale();
        // if source has owner, it returns owner's price scale
        // and it does not have source in their list
        if (priceScale && priceScale._internal_dataSources().indexOf(source) >= 0) {
            priceScale._internal_removeDataSource(source);
        }
        if (priceScale !== null) {
            priceScale._internal_invalidateSourcesCache();
            this._internal_recalculatePriceScale(priceScale);
        }
        this._private__cachedOrderedSources = null;
    }
    _internal_priceScalePosition(priceScale) {
        if (priceScale === this._private__leftPriceScale) {
            return 'left';
        }
        if (priceScale === this._private__rightPriceScale) {
            return 'right';
        }
        return 'overlay';
    }
    _internal_leftPriceScale() {
        return this._private__leftPriceScale;
    }
    _internal_rightPriceScale() {
        return this._private__rightPriceScale;
    }
    _internal_startScalePrice(priceScale, x) {
        priceScale._internal_startScale(x);
    }
    _internal_scalePriceTo(priceScale, x) {
        priceScale._internal_scaleTo(x);
        // TODO: be more smart and update only affected views
        this._internal_updateAllSources();
    }
    _internal_endScalePrice(priceScale) {
        priceScale._internal_endScale();
    }
    _internal_startScrollPrice(priceScale, x) {
        priceScale._internal_startScroll(x);
    }
    _internal_scrollPriceTo(priceScale, x) {
        priceScale._internal_scrollTo(x);
        this._internal_updateAllSources();
    }
    _internal_endScrollPrice(priceScale) {
        priceScale._internal_endScroll();
    }
    _internal_updateAllSources() {
        this._private__dataSources.forEach((source) => {
            source._internal_updateAllViews();
        });
    }
    _internal_defaultPriceScale() {
        let priceScale = null;
        if (this._private__model._internal_options().rightPriceScale.visible && this._private__rightPriceScale._internal_dataSources().length !== 0) {
            priceScale = this._private__rightPriceScale;
        }
        else if (this._private__model._internal_options().leftPriceScale.visible && this._private__leftPriceScale._internal_dataSources().length !== 0) {
            priceScale = this._private__leftPriceScale;
        }
        else if (this._private__dataSources.length !== 0) {
            priceScale = this._private__dataSources[0]._internal_priceScale();
        }
        if (priceScale === null) {
            priceScale = this._private__rightPriceScale;
        }
        return priceScale;
    }
    _internal_defaultVisiblePriceScale() {
        let priceScale = null;
        if (this._private__model._internal_options().rightPriceScale.visible) {
            priceScale = this._private__rightPriceScale;
        }
        else if (this._private__model._internal_options().leftPriceScale.visible) {
            priceScale = this._private__leftPriceScale;
        }
        return priceScale;
    }
    _internal_recalculatePriceScale(priceScale) {
        if (priceScale === null || !priceScale._internal_isAutoScale()) {
            return;
        }
        this._private__recalculatePriceScaleImpl(priceScale);
    }
    _internal_resetPriceScale(priceScale) {
        const visibleBars = this._private__timeScale._internal_visibleStrictRange();
        priceScale._internal_setMode({ _internal_autoScale: true });
        if (visibleBars !== null) {
            priceScale._internal_recalculatePriceRange(visibleBars);
        }
        this._internal_updateAllSources();
    }
    _internal_momentaryAutoScale() {
        this._private__recalculatePriceScaleImpl(this._private__leftPriceScale);
        this._private__recalculatePriceScaleImpl(this._private__rightPriceScale);
    }
    _internal_recalculate() {
        this._internal_recalculatePriceScale(this._private__leftPriceScale);
        this._internal_recalculatePriceScale(this._private__rightPriceScale);
        this._private__dataSources.forEach((ds) => {
            if (this._internal_isOverlay(ds)) {
                this._internal_recalculatePriceScale(ds._internal_priceScale());
            }
        });
        this._internal_updateAllSources();
        this._private__model._internal_lightUpdate();
    }
    _internal_orderedSources() {
        if (this._private__cachedOrderedSources === null) {
            this._private__cachedOrderedSources = sortSources(this._private__dataSources);
        }
        return this._private__cachedOrderedSources;
    }
    _internal_orderedSeries() {
        return this._internal_orderedSources().filter(isSeries);
    }
    _internal_onDestroyed() {
        return this._private__destroyed;
    }
    _internal_grid() {
        return this._private__grid;
    }
    _internal_attachPrimitive(primitive) {
        this._private__primitives.push(new PanePrimitiveWrapper$1(primitive));
    }
    _internal_detachPrimitive(source) {
        this._private__primitives = this._private__primitives.filter((wrapper) => wrapper._internal_primitive() !== source);
        if (source.detached) {
            source.detached();
        }
        this._private__model._internal_lightUpdate();
    }
    _internal_primitives() {
        return this._private__primitives;
    }
    _internal_primitiveHitTest(x, y) {
        return this._private__primitives
            .map((primitive) => primitive._internal_hitTest(x, y))
            .filter((result) => result !== null);
    }
    _private__recalculatePriceScaleImpl(priceScale) {
        // TODO: can use this checks
        const sourceForAutoScale = priceScale._internal_sourcesForAutoScale();
        if (sourceForAutoScale && sourceForAutoScale.length > 0 && !this._private__timeScale._internal_isEmpty()) {
            const visibleBars = this._private__timeScale._internal_visibleStrictRange();
            if (visibleBars !== null) {
                priceScale._internal_recalculatePriceRange(visibleBars);
            }
        }
        priceScale._internal_updateAllViews();
    }
    _private__getZOrderMinMax() {
        const sources = this._internal_orderedSources();
        if (sources.length === 0) {
            return { _internal_minZOrder: 0, _internal_maxZOrder: 0 };
        }
        let minZOrder = 0;
        let maxZOrder = 0;
        for (let j = 0; j < sources.length; j++) {
            const ds = sources[j];
            const zOrder = ds._internal_zorder();
            if (zOrder !== null) {
                if (zOrder < minZOrder) {
                    minZOrder = zOrder;
                }
                if (zOrder > maxZOrder) {
                    maxZOrder = zOrder;
                }
            }
        }
        return { _internal_minZOrder: minZOrder, _internal_maxZOrder: maxZOrder };
    }
    _private__insertDataSource(source, priceScaleId, zOrder) {
        let priceScale = this._internal_priceScaleById(priceScaleId);
        if (priceScale === null) {
            priceScale = this._private__createPriceScale(priceScaleId, this._private__model._internal_options().overlayPriceScales);
        }
        this._private__dataSources.push(source);
        if (!isDefaultPriceScale(priceScaleId)) {
            const overlaySources = this._private__overlaySourcesByScaleId.get(priceScaleId) || [];
            overlaySources.push(source);
            this._private__overlaySourcesByScaleId.set(priceScaleId, overlaySources);
        }
        priceScale._internal_addDataSource(source);
        source._internal_setPriceScale(priceScale);
        source._internal_setZorder(zOrder);
        this._internal_recalculatePriceScale(priceScale);
        this._private__cachedOrderedSources = null;
    }
    _private__onPriceScaleModeChanged(priceScale, oldMode, newMode) {
        if (oldMode._internal_mode === newMode._internal_mode) {
            return;
        }
        // momentary auto scale if we toggle percentage/indexedTo100 mode
        this._private__recalculatePriceScaleImpl(priceScale);
    }
    _private__createPriceScale(id, options) {
        const actualOptions = { visible: true, autoScale: true, ...clone(options) };
        const priceScale = new PriceScale(id, actualOptions, this._private__model._internal_options()['layout'], this._private__model._internal_options().localization, this._private__model._internal_colorParser());
        priceScale._internal_setHeight(this._internal_height());
        return priceScale;
    }
}

// returns true if item is above reference
function comparePrimitiveZOrder(item, reference) {
    return (!reference ||
        (item === 'top' && reference !== 'top') ||
        (item === 'normal' && reference === 'bottom'));
}
function findBestPrimitiveHitTest(sources, x, y) {
    let bestPrimitiveHit;
    let bestHitSource;
    for (const source of sources) {
        const primitiveHitResults = source._internal_primitiveHitTest?.(x, y) ?? [];
        for (const hitResult of primitiveHitResults) {
            if (comparePrimitiveZOrder(hitResult.zOrder, bestPrimitiveHit?.zOrder)) {
                bestPrimitiveHit = hitResult;
                bestHitSource = source;
            }
        }
    }
    if (!bestPrimitiveHit || !bestHitSource) {
        return null;
    }
    return {
        _internal_hit: bestPrimitiveHit,
        _internal_source: bestHitSource,
    };
}
function convertPrimitiveHitResult(primitiveHit) {
    return {
        _internal_source: primitiveHit._internal_source,
        _internal_object: {
            _internal_externalId: primitiveHit._internal_hit.externalId,
        },
        _internal_cursorStyle: primitiveHit._internal_hit.cursorStyle,
    };
}
/**
 * Performs a hit test on a collection of pane views to determine which view and object
 * is located at a given coordinate (x, y) and returns the matching pane view and
 * hit-tested result object, or null if no match is found.
 */
function hitTestPaneView(paneViews, x, y, pane) {
    for (const paneView of paneViews) {
        const renderer = paneView._internal_renderer(pane);
        if (renderer !== null && renderer._internal_hitTest) {
            const result = renderer._internal_hitTest(x, y);
            if (result !== null) {
                return {
                    _internal_view: paneView,
                    _internal_object: result,
                };
            }
        }
    }
    return null;
}
function isDataSource(source) {
    return source._internal_paneViews !== undefined;
}
// eslint-disable-next-line complexity
function hitTestPane(pane, x, y) {
    const sources = [pane, ...pane._internal_orderedSources()];
    const bestPrimitiveHit = findBestPrimitiveHitTest(sources, x, y);
    if (bestPrimitiveHit?._internal_hit.zOrder === 'top') {
        // a primitive hit on the 'top' layer will always beat the built-in hit tests
        // (on normal layer) so we can return early here.
        return convertPrimitiveHitResult(bestPrimitiveHit);
    }
    for (const source of sources) {
        if (bestPrimitiveHit && bestPrimitiveHit._internal_source === source && bestPrimitiveHit._internal_hit.zOrder !== 'bottom' && !bestPrimitiveHit._internal_hit.isBackground) {
            // a primitive will be drawn above a built-in item like a series marker
            // therefore it takes precedence here.
            return convertPrimitiveHitResult(bestPrimitiveHit);
        }
        if (isDataSource(source)) {
            const sourceResult = hitTestPaneView(source._internal_paneViews(pane), x, y, pane);
            if (sourceResult !== null) {
                return {
                    _internal_source: source,
                    _internal_view: sourceResult._internal_view,
                    _internal_object: sourceResult._internal_object,
                };
            }
        }
        if (bestPrimitiveHit && bestPrimitiveHit._internal_source === source && bestPrimitiveHit._internal_hit.zOrder !== 'bottom' && bestPrimitiveHit._internal_hit.isBackground) {
            return convertPrimitiveHitResult(bestPrimitiveHit);
        }
    }
    if (bestPrimitiveHit?._internal_hit) {
        // return primitive hits for the 'bottom' layer
        return convertPrimitiveHitResult(bestPrimitiveHit);
    }
    return null;
}

class FormattedLabelsCache {
    constructor(format, horzScaleBehavior, size = 50) {
        this._private__actualSize = 0;
        this._private__usageTick = 1;
        this._private__oldestTick = 1;
        this._private__cache = new Map();
        this._private__tick2Labels = new Map();
        this._private__format = format;
        this._private__horzScaleBehavior = horzScaleBehavior;
        this._private__maxSize = size;
    }
    _internal_format(tickMark) {
        const time = tickMark.time;
        const cacheKey = this._private__horzScaleBehavior.cacheKey(time);
        const tick = this._private__cache.get(cacheKey);
        if (tick !== undefined) {
            return tick._internal_string;
        }
        if (this._private__actualSize === this._private__maxSize) {
            const oldestValue = this._private__tick2Labels.get(this._private__oldestTick);
            this._private__tick2Labels.delete(this._private__oldestTick);
            this._private__cache.delete(ensureDefined(oldestValue));
            this._private__oldestTick++;
            this._private__actualSize--;
        }
        const str = this._private__format(tickMark);
        this._private__cache.set(cacheKey, { _internal_string: str, _internal_tick: this._private__usageTick });
        this._private__tick2Labels.set(this._private__usageTick, cacheKey);
        this._private__actualSize++;
        this._private__usageTick++;
        return str;
    }
}

class RangeImpl {
    constructor(left, right) {
        assert(left <= right, 'right should be >= left');
        this._private__left = left;
        this._private__right = right;
    }
    _internal_left() {
        return this._private__left;
    }
    _internal_right() {
        return this._private__right;
    }
    _internal_count() {
        return this._private__right - this._private__left + 1;
    }
    _internal_contains(index) {
        return this._private__left <= index && index <= this._private__right;
    }
    _internal_equals(other) {
        return this._private__left === other._internal_left() && this._private__right === other._internal_right();
    }
}
function areRangesEqual(first, second) {
    if (first === null || second === null) {
        return first === second;
    }
    return first._internal_equals(second);
}

class TickMarks {
    constructor() {
        this._private__marksByWeight = new Map();
        this._private__cache = null;
        this._private__uniformDistribution = false;
    }
    _internal_setUniformDistribution(val) {
        this._private__uniformDistribution = val;
        this._private__cache = null;
    }
    _internal_setTimeScalePoints(newPoints, firstChangedPointIndex) {
        this._private__removeMarksSinceIndex(firstChangedPointIndex);
        this._private__cache = null;
        for (let index = firstChangedPointIndex; index < newPoints.length; ++index) {
            const point = newPoints[index];
            let marksForWeight = this._private__marksByWeight.get(point.timeWeight);
            if (marksForWeight === undefined) {
                marksForWeight = [];
                this._private__marksByWeight.set(point.timeWeight, marksForWeight);
            }
            marksForWeight.push({
                index: index,
                time: point.time,
                weight: point.timeWeight,
                originalTime: point.originalTime,
            });
        }
    }
    _internal_build(spacing, maxWidth, checkIndicesForData, indicesWithDataMap, indicesWithDataId) {
        const maxIndexesPerMark = Math.ceil(maxWidth / spacing);
        if (this._private__cache === null ||
            this._private__cache._internal_maxIndexesPerMark !== maxIndexesPerMark ||
            indicesWithDataId !== this._private__cache._internal_indicesWithDataId ||
            checkIndicesForData !== this._private__cache._internal_checkIndicesForData) {
            this._private__cache = {
                _internal_indicesWithDataId: indicesWithDataId,
                _internal_checkIndicesForData: checkIndicesForData,
                _internal_marks: this._private__buildMarksImpl(maxIndexesPerMark, checkIndicesForData, indicesWithDataMap),
                _internal_maxIndexesPerMark: maxIndexesPerMark,
            };
        }
        return this._private__cache._internal_marks;
    }
    _private__removeMarksSinceIndex(sinceIndex) {
        if (sinceIndex === 0) {
            this._private__marksByWeight.clear();
            return;
        }
        const weightsToClear = [];
        this._private__marksByWeight.forEach((marks, timeWeight) => {
            if (sinceIndex <= marks[0].index) {
                weightsToClear.push(timeWeight);
            }
            else {
                marks.splice(lowerBound(marks, sinceIndex, (tm) => tm.index < sinceIndex), Infinity);
            }
        });
        for (const weight of weightsToClear) {
            this._private__marksByWeight.delete(weight);
        }
    }
    _private__buildMarksImpl(maxIndexesPerMark, checkIndicesForData, indicesWithDataMap) {
        let marks = [];
        const canBeIncluded = (mark) => !checkIndicesForData || indicesWithDataMap.has(mark.index);
        for (const weight of Array.from(this._private__marksByWeight.keys()).sort((a, b) => b - a)) {
            if (!this._private__marksByWeight.get(weight)) {
                continue;
            }
            // Built tickMarks are now prevMarks, and marks it as new array
            const prevMarks = marks;
            marks = [];
            const prevMarksLength = prevMarks.length;
            let prevMarksPointer = 0;
            const currentWeight = ensureDefined(this._private__marksByWeight.get(weight));
            const currentWeightLength = currentWeight.length;
            let rightIndex = Infinity;
            let leftIndex = -Infinity;
            for (let i = 0; i < currentWeightLength; i++) {
                const mark = currentWeight[i];
                const currentIndex = mark.index;
                // Determine indexes with which current index will be compared
                // All marks to the right is moved to new array
                while (prevMarksPointer < prevMarksLength) {
                    const lastMark = prevMarks[prevMarksPointer];
                    const lastIndex = lastMark.index;
                    if (lastIndex < currentIndex && canBeIncluded(lastMark)) {
                        prevMarksPointer++;
                        marks.push(lastMark);
                        leftIndex = lastIndex;
                        rightIndex = Infinity;
                    }
                    else {
                        rightIndex = lastIndex;
                        break;
                    }
                }
                if (rightIndex - currentIndex >= maxIndexesPerMark &&
                    currentIndex - leftIndex >= maxIndexesPerMark &&
                    canBeIncluded(mark)) {
                    // TickMark fits. Place it into new array
                    marks.push(mark);
                    leftIndex = currentIndex;
                }
                else {
                    if (this._private__uniformDistribution) {
                        return prevMarks;
                    }
                }
            }
            // Place all unused tickMarks into new array;
            for (; prevMarksPointer < prevMarksLength; prevMarksPointer++) {
                if (canBeIncluded(prevMarks[prevMarksPointer])) {
                    marks.push(prevMarks[prevMarksPointer]);
                }
            }
        }
        return marks;
    }
}

class TimeScaleVisibleRange {
    constructor(logicalRange) {
        this._private__logicalRange = logicalRange;
    }
    _internal_strictRange() {
        if (this._private__logicalRange === null) {
            return null;
        }
        return new RangeImpl(Math.floor(this._private__logicalRange._internal_left()), Math.ceil(this._private__logicalRange._internal_right()));
    }
    _internal_logicalRange() {
        return this._private__logicalRange;
    }
    static _internal_invalid() {
        return new TimeScaleVisibleRange(null);
    }
}

const defaultTickMarkMaxCharacterLength = 8;
function markWithGreaterWeight$2(a, b) {
    return a.weight > b.weight ? a : b;
}
class TimeScale {
    constructor(model, options, localizationOptions, horzScaleBehavior) {
        this._private__width = 0;
        this._private__baseIndexOrNull = null;
        this._private__points = [];
        this._private__scrollStartPoint = null;
        this._private__scaleStartPoint = null;
        this._private__tickMarks = new TickMarks();
        this._private__formattedByWeight = new Map();
        this._private__visibleRange = TimeScaleVisibleRange._internal_invalid();
        this._private__visibleRangeInvalidated = true;
        this._private__visibleBarsChanged = new Delegate();
        this._private__logicalRangeChanged = new Delegate();
        this._private__optionsApplied = new Delegate();
        this._private__commonTransitionStartState = null;
        this._private__timeMarksCache = null;
        this._private__indicesWithData = new Map();
        this._private__indicesWithDataUpdateId = -1;
        this._private__labels = [];
        this._private__options = options;
        this._private__localizationOptions = localizationOptions;
        this._private__rightOffset = options.rightOffset;
        this._private__barSpacing = options.barSpacing;
        this._private__model = model;
        this._private__horzScaleBehavior = horzScaleBehavior;
        this._private__updateDateTimeFormatter();
        this._private__tickMarks._internal_setUniformDistribution(options.uniformDistribution);
        this._internal_recalculateIndicesWithData();
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_applyLocalizationOptions(localizationOptions) {
        merge(this._private__localizationOptions, localizationOptions);
        this._private__invalidateTickMarks();
        this._private__updateDateTimeFormatter();
    }
    _internal_applyOptions(options, localizationOptions) {
        merge(this._private__options, options);
        if (this._private__options.fixLeftEdge) {
            this._private__doFixLeftEdge();
        }
        if (this._private__options.fixRightEdge) {
            this._private__doFixRightEdge();
        }
        // note that bar spacing should be applied before right offset
        // because right offset depends on bar spacing
        if (options.barSpacing !== undefined) {
            this._private__model._internal_setBarSpacing(options.barSpacing);
        }
        if (options.rightOffset !== undefined) {
            this._private__model._internal_setRightOffset(options.rightOffset);
        }
        if (options.minBarSpacing !== undefined || options.maxBarSpacing !== undefined) {
            // yes, if we apply bar spacing constrains then we need to correct bar spacing
            // the easiest way is to apply it once again
            this._private__model._internal_setBarSpacing(options.barSpacing ?? this._private__barSpacing);
        }
        if (options.ignoreWhitespaceIndices !== undefined && options.ignoreWhitespaceIndices !== this._private__options.ignoreWhitespaceIndices) {
            this._internal_recalculateIndicesWithData();
        }
        this._private__invalidateTickMarks();
        this._private__updateDateTimeFormatter();
        this._private__optionsApplied._internal_fire();
    }
    _internal_indexToTime(index) {
        return this._private__points[index]?.time ?? null;
    }
    _internal_indexToTimeScalePoint(index) {
        return this._private__points[index] ?? null;
    }
    _internal_timeToIndex(time, findNearest) {
        if (this._private__points.length < 1) {
            // no time points available
            return null;
        }
        if (this._private__horzScaleBehavior.key(time) > this._private__horzScaleBehavior.key(this._private__points[this._private__points.length - 1].time)) {
            // special case
            return findNearest ? this._private__points.length - 1 : null;
        }
        const index = lowerBound(this._private__points, this._private__horzScaleBehavior.key(time), (a, b) => this._private__horzScaleBehavior.key(a.time) < b);
        if (this._private__horzScaleBehavior.key(time) < this._private__horzScaleBehavior.key(this._private__points[index].time)) {
            return findNearest ? index : null;
        }
        return index;
    }
    _internal_isEmpty() {
        return this._private__width === 0 || this._private__points.length === 0 || this._private__baseIndexOrNull === null;
    }
    _internal_hasPoints() {
        return this._private__points.length > 0;
    }
    // strict range: integer indices of the bars in the visible range rounded in more wide direction
    _internal_visibleStrictRange() {
        this._private__updateVisibleRange();
        return this._private__visibleRange._internal_strictRange();
    }
    _internal_visibleLogicalRange() {
        this._private__updateVisibleRange();
        return this._private__visibleRange._internal_logicalRange();
    }
    _internal_visibleTimeRange() {
        const visibleBars = this._internal_visibleStrictRange();
        if (visibleBars === null) {
            return null;
        }
        const range = {
            from: visibleBars._internal_left(),
            to: visibleBars._internal_right(),
        };
        return this._internal_timeRangeForLogicalRange(range);
    }
    _internal_timeRangeForLogicalRange(range) {
        const from = Math.round(range.from);
        const to = Math.round(range.to);
        const firstIndex = ensureNotNull(this._private__firstIndex());
        const lastIndex = ensureNotNull(this._private__lastIndex());
        return {
            from: ensureNotNull(this._internal_indexToTimeScalePoint(Math.max(firstIndex, from))),
            to: ensureNotNull(this._internal_indexToTimeScalePoint(Math.min(lastIndex, to))),
        };
    }
    _internal_logicalRangeForTimeRange(range) {
        return {
            from: ensureNotNull(this._internal_timeToIndex(range.from, true)),
            to: ensureNotNull(this._internal_timeToIndex(range.to, true)),
        };
    }
    _internal_width() {
        return this._private__width;
    }
    _internal_setWidth(newWidth) {
        if (!isFinite(newWidth) || newWidth <= 0) {
            return;
        }
        if (this._private__width === newWidth) {
            return;
        }
        // when we change the width and we need to correct visible range because of fixing left edge
        // we need to check the previous visible range rather than the new one
        // because it might be updated by changing width, bar spacing, etc
        // but we need to try to keep the same range
        const previousVisibleRange = this._internal_visibleLogicalRange();
        const oldWidth = this._private__width;
        this._private__width = newWidth;
        this._private__visibleRangeInvalidated = true;
        if (this._private__options.lockVisibleTimeRangeOnResize && oldWidth !== 0) {
            // recalculate bar spacing
            const newBarSpacing = this._private__barSpacing * newWidth / oldWidth;
            this._private__barSpacing = newBarSpacing;
        }
        // if time scale is scrolled to the end of data and we have fixed right edge
        // keep left edge instead of right
        // we need it to avoid "shaking" if the last bar visibility affects time scale width
        if (this._private__options.fixLeftEdge) {
            // note that logical left range means not the middle of a bar (it's the left border)
            if (previousVisibleRange !== null && previousVisibleRange._internal_left() <= 0) {
                const delta = oldWidth - newWidth;
                // reduce  _rightOffset means move right
                // we could move more than required - this will be fixed by _correctOffset()
                this._private__rightOffset -= Math.round(delta / this._private__barSpacing) + 1;
                this._private__visibleRangeInvalidated = true;
            }
        }
        // updating bar spacing should be first because right offset depends on it
        this._private__correctBarSpacing();
        this._private__correctOffset();
    }
    _internal_indexToCoordinate(index) {
        if (this._internal_isEmpty() || !isInteger(index)) {
            return 0;
        }
        const baseIndex = this._internal_baseIndex();
        const deltaFromRight = baseIndex + this._private__rightOffset - index;
        const coordinate = this._private__width - (deltaFromRight + 0.5) * this._private__barSpacing - 1;
        return coordinate;
    }
    _internal_indexesToCoordinates(points, visibleRange) {
        const baseIndex = this._internal_baseIndex();
        const indexFrom = (visibleRange === undefined) ? 0 : visibleRange.from;
        const indexTo = (visibleRange === undefined) ? points.length : visibleRange.to;
        for (let i = indexFrom; i < indexTo; i++) {
            const index = points[i]._internal_time;
            const deltaFromRight = baseIndex + this._private__rightOffset - index;
            const coordinate = this._private__width - (deltaFromRight + 0.5) * this._private__barSpacing - 1;
            points[i]._internal_x = coordinate;
        }
    }
    _internal_coordinateToIndex(x, considerIgnoreWhitespace) {
        const index = Math.ceil(this._private__coordinateToFloatIndex(x));
        if (!considerIgnoreWhitespace ||
            !this._private__options.ignoreWhitespaceIndices ||
            this._private__shouldConsiderIndex(index)) {
            return index;
        }
        return this._private__findNearestIndexWithData(index);
    }
    _internal_setRightOffset(offset) {
        this._private__visibleRangeInvalidated = true;
        this._private__rightOffset = offset;
        this._private__correctOffset();
        this._private__model._internal_recalculateAllPanes();
        this._private__model._internal_lightUpdate();
    }
    _internal_barSpacing() {
        return this._private__barSpacing;
    }
    _internal_setBarSpacing(newBarSpacing) {
        this._private__setBarSpacing(newBarSpacing);
        // do not allow scroll out of visible bars
        this._private__correctOffset();
        this._private__model._internal_recalculateAllPanes();
        this._private__model._internal_lightUpdate();
    }
    _internal_rightOffset() {
        return this._private__rightOffset;
    }
    // eslint-disable-next-line complexity
    _internal_marks() {
        if (this._internal_isEmpty()) {
            return null;
        }
        if (this._private__timeMarksCache !== null) {
            return this._private__timeMarksCache;
        }
        const spacing = this._private__barSpacing;
        const fontSize = this._private__model._internal_options()['layout'].fontSize;
        const pixelsPer8Characters = (fontSize + 4) * 5;
        const pixelsPerCharacter = pixelsPer8Characters / defaultTickMarkMaxCharacterLength;
        const maxLabelWidth = pixelsPerCharacter * (this._private__options.tickMarkMaxCharacterLength || defaultTickMarkMaxCharacterLength);
        const indexPerLabel = Math.round(maxLabelWidth / spacing);
        const visibleBars = ensureNotNull(this._internal_visibleStrictRange());
        const firstBar = Math.max(visibleBars._internal_left(), visibleBars._internal_left() - indexPerLabel);
        const lastBar = Math.max(visibleBars._internal_right(), visibleBars._internal_right() - indexPerLabel);
        const items = this._private__tickMarks._internal_build(spacing, maxLabelWidth, this._private__options.ignoreWhitespaceIndices, this._private__indicesWithData, this._private__indicesWithDataUpdateId);
        // according to indexPerLabel value this value means "earliest index which _might be_ used as the second label on time scale"
        const earliestIndexOfSecondLabel = this._private__firstIndex() + indexPerLabel;
        // according to indexPerLabel value this value means "earliest index which _might be_ used as the second last label on time scale"
        const indexOfSecondLastLabel = this._private__lastIndex() - indexPerLabel;
        const isAllScalingAndScrollingDisabled = this._private__isAllScalingAndScrollingDisabled();
        const isLeftEdgeFixed = this._private__options.fixLeftEdge || isAllScalingAndScrollingDisabled;
        const isRightEdgeFixed = this._private__options.fixRightEdge || isAllScalingAndScrollingDisabled;
        let targetIndex = 0;
        for (const tm of items) {
            if (!(firstBar <= tm.index && tm.index <= lastBar)) {
                continue;
            }
            let label;
            if (targetIndex < this._private__labels.length) {
                label = this._private__labels[targetIndex];
                label.coord = this._internal_indexToCoordinate(tm.index);
                label.label = this._private__formatLabel(tm);
                label.weight = tm.weight;
            }
            else {
                label = {
                    needAlignCoordinate: false,
                    coord: this._internal_indexToCoordinate(tm.index),
                    label: this._private__formatLabel(tm),
                    weight: tm.weight,
                };
                this._private__labels.push(label);
            }
            if (this._private__barSpacing > (maxLabelWidth / 2) && !isAllScalingAndScrollingDisabled) {
                // if there is enough space then let's show all tick marks as usual
                label.needAlignCoordinate = false;
            }
            else {
                // if a user is able to scroll after a tick mark then show it as usual, otherwise the coordinate might be aligned
                // if the index is for the second (last) label or later (earlier) then most likely this label might be displayed without correcting the coordinate
                label.needAlignCoordinate = (isLeftEdgeFixed && tm.index <= earliestIndexOfSecondLabel) || (isRightEdgeFixed && tm.index >= indexOfSecondLastLabel);
            }
            targetIndex++;
        }
        this._private__labels.length = targetIndex;
        this._private__timeMarksCache = this._private__labels;
        return this._private__labels;
    }
    _internal_restoreDefault() {
        this._private__visibleRangeInvalidated = true;
        this._internal_setBarSpacing(this._private__options.barSpacing);
        this._internal_setRightOffset(this._private__options.rightOffset);
    }
    _internal_setBaseIndex(baseIndex) {
        this._private__visibleRangeInvalidated = true;
        this._private__baseIndexOrNull = baseIndex;
        this._private__correctOffset();
        this._private__doFixLeftEdge();
    }
    /**
     * Zoom in/out the scale around a `zoomPoint` on `scale` value.
     *
     * @param zoomPoint - X coordinate of the point to apply the zoom.
     * If `rightBarStaysOnScroll` option is disabled, then will be used to restore right offset.
     * @param scale - Zoom value (in 1/10 parts of current bar spacing).
     * Negative value means zoom out, positive - zoom in.
     */
    _internal_zoom(zoomPoint, scale) {
        const floatIndexAtZoomPoint = this._private__coordinateToFloatIndex(zoomPoint);
        const barSpacing = this._internal_barSpacing();
        const newBarSpacing = barSpacing + scale * (barSpacing / 10);
        // zoom in/out bar spacing
        this._internal_setBarSpacing(newBarSpacing);
        if (!this._private__options.rightBarStaysOnScroll) {
            // and then correct right offset to move index under zoomPoint back to its coordinate
            this._internal_setRightOffset(this._internal_rightOffset() + (floatIndexAtZoomPoint - this._private__coordinateToFloatIndex(zoomPoint)));
        }
    }
    _internal_startScale(x) {
        if (this._private__scrollStartPoint) {
            this._internal_endScroll();
        }
        if (this._private__scaleStartPoint !== null || this._private__commonTransitionStartState !== null) {
            return;
        }
        if (this._internal_isEmpty()) {
            return;
        }
        this._private__scaleStartPoint = x;
        this._private__saveCommonTransitionsStartState();
    }
    _internal_scaleTo(x) {
        if (this._private__commonTransitionStartState === null) {
            return;
        }
        const startLengthFromRight = clamp(this._private__width - x, 0, this._private__width);
        const currentLengthFromRight = clamp(this._private__width - ensureNotNull(this._private__scaleStartPoint), 0, this._private__width);
        if (startLengthFromRight === 0 || currentLengthFromRight === 0) {
            return;
        }
        this._internal_setBarSpacing(this._private__commonTransitionStartState._internal_barSpacing * startLengthFromRight / currentLengthFromRight);
    }
    _internal_endScale() {
        if (this._private__scaleStartPoint === null) {
            return;
        }
        this._private__scaleStartPoint = null;
        this._private__clearCommonTransitionsStartState();
    }
    _internal_startScroll(x) {
        if (this._private__scrollStartPoint !== null || this._private__commonTransitionStartState !== null) {
            return;
        }
        if (this._internal_isEmpty()) {
            return;
        }
        this._private__scrollStartPoint = x;
        this._private__saveCommonTransitionsStartState();
    }
    _internal_scrollTo(x) {
        if (this._private__scrollStartPoint === null) {
            return;
        }
        const shiftInLogical = (this._private__scrollStartPoint - x) / this._internal_barSpacing();
        this._private__rightOffset = ensureNotNull(this._private__commonTransitionStartState)._internal_rightOffset + shiftInLogical;
        this._private__visibleRangeInvalidated = true;
        // do not allow scroll out of visible bars
        this._private__correctOffset();
    }
    _internal_endScroll() {
        if (this._private__scrollStartPoint === null) {
            return;
        }
        this._private__scrollStartPoint = null;
        this._private__clearCommonTransitionsStartState();
    }
    _internal_scrollToRealTime() {
        this._internal_scrollToOffsetAnimated(this._private__options.rightOffset);
    }
    _internal_scrollToOffsetAnimated(offset, animationDuration = 400 /* Constants.DefaultAnimationDuration */) {
        if (!isFinite(offset)) {
            throw new RangeError('offset is required and must be finite number');
        }
        if (!isFinite(animationDuration) || animationDuration <= 0) {
            throw new RangeError('animationDuration (optional) must be finite positive number');
        }
        const source = this._private__rightOffset;
        const animationStart = performance.now();
        this._private__model._internal_setTimeScaleAnimation({
            _internal_finished: (time) => (time - animationStart) / animationDuration >= 1,
            _internal_getPosition: (time) => {
                const animationProgress = (time - animationStart) / animationDuration;
                const finishAnimation = animationProgress >= 1;
                return finishAnimation ? offset : source + (offset - source) * animationProgress;
            },
        });
    }
    _internal_update(newPoints, firstChangedPointIndex) {
        this._private__visibleRangeInvalidated = true;
        this._private__points = newPoints;
        this._private__tickMarks._internal_setTimeScalePoints(newPoints, firstChangedPointIndex);
        this._private__correctOffset();
    }
    _internal_visibleBarsChanged() {
        return this._private__visibleBarsChanged;
    }
    _internal_logicalRangeChanged() {
        return this._private__logicalRangeChanged;
    }
    _internal_optionsApplied() {
        return this._private__optionsApplied;
    }
    _internal_baseIndex() {
        // null is used to known that baseIndex is not set yet
        // so in methods which should known whether it is set or not
        // we should check field `_baseIndexOrNull` instead of getter `baseIndex()`
        // see minRightOffset for example
        return this._private__baseIndexOrNull || 0;
    }
    _internal_setVisibleRange(range) {
        const length = range._internal_count();
        this._private__setBarSpacing(this._private__width / length);
        this._private__rightOffset = range._internal_right() - this._internal_baseIndex();
        this._private__correctOffset();
        this._private__visibleRangeInvalidated = true;
        this._private__model._internal_recalculateAllPanes();
        this._private__model._internal_lightUpdate();
    }
    _internal_fitContent() {
        const first = this._private__firstIndex();
        const last = this._private__lastIndex();
        if (first === null || last === null) {
            return;
        }
        this._internal_setVisibleRange(new RangeImpl(first, last + this._private__options.rightOffset));
    }
    _internal_setLogicalRange(range) {
        const barRange = new RangeImpl(range.from, range.to);
        this._internal_setVisibleRange(barRange);
    }
    _internal_formatDateTime(timeScalePoint) {
        if (this._private__localizationOptions.timeFormatter !== undefined) {
            return this._private__localizationOptions.timeFormatter(timeScalePoint.originalTime);
        }
        return this._private__horzScaleBehavior.formatHorzItem(timeScalePoint.time);
    }
    _internal_recalculateIndicesWithData() {
        if (!this._private__options.ignoreWhitespaceIndices) {
            return;
        }
        this._private__indicesWithData.clear();
        const series = this._private__model._internal_serieses();
        for (const s of series) {
            for (const index of s._internal_fulfilledIndices()) {
                this._private__indicesWithData.set(index, true);
            }
        }
        this._private__indicesWithDataUpdateId++;
    }
    _private__isAllScalingAndScrollingDisabled() {
        const handleScroll = this._private__model._internal_options()['handleScroll'];
        const handleScale = this._private__model._internal_options()['handleScale'];
        return !handleScroll.horzTouchDrag
            && !handleScroll.mouseWheel
            && !handleScroll.pressedMouseMove
            && !handleScroll.vertTouchDrag
            && !handleScale.axisDoubleClickReset.time
            && !handleScale.axisPressedMouseMove.time
            && !handleScale.mouseWheel
            && !handleScale.pinch;
    }
    _private__firstIndex() {
        return this._private__points.length === 0 ? null : 0;
    }
    _private__lastIndex() {
        return this._private__points.length === 0 ? null : (this._private__points.length - 1);
    }
    _private__rightOffsetForCoordinate(x) {
        return (this._private__width - 1 - x) / this._private__barSpacing;
    }
    _private__coordinateToFloatIndex(x) {
        const deltaFromRight = this._private__rightOffsetForCoordinate(x);
        const baseIndex = this._internal_baseIndex();
        const index = baseIndex + this._private__rightOffset - deltaFromRight;
        // JavaScript uses very strange rounding
        // we need rounding to avoid problems with calculation errors
        return Math.round(index * 1000000) / 1000000;
    }
    _private__setBarSpacing(newBarSpacing) {
        const oldBarSpacing = this._private__barSpacing;
        this._private__barSpacing = newBarSpacing;
        this._private__correctBarSpacing();
        // this._barSpacing might be changed in _correctBarSpacing
        if (oldBarSpacing !== this._private__barSpacing) {
            this._private__visibleRangeInvalidated = true;
            this._private__resetTimeMarksCache();
        }
    }
    _private__updateVisibleRange() {
        if (!this._private__visibleRangeInvalidated) {
            return;
        }
        this._private__visibleRangeInvalidated = false;
        if (this._internal_isEmpty()) {
            this._private__setVisibleRange(TimeScaleVisibleRange._internal_invalid());
            return;
        }
        const baseIndex = this._internal_baseIndex();
        const newBarsLength = this._private__width / this._private__barSpacing;
        const rightBorder = this._private__rightOffset + baseIndex;
        const leftBorder = rightBorder - newBarsLength + 1;
        const logicalRange = new RangeImpl(leftBorder, rightBorder);
        this._private__setVisibleRange(new TimeScaleVisibleRange(logicalRange));
    }
    _private__correctBarSpacing() {
        const barSpacing = clamp(this._private__barSpacing, this._private__minBarSpacing(), this._private__maxBarSpacing());
        if (this._private__barSpacing !== barSpacing) {
            this._private__barSpacing = barSpacing;
            this._private__visibleRangeInvalidated = true;
        }
    }
    _private__maxBarSpacing() {
        if (this._private__options.maxBarSpacing > 0) {
            // option takes precedance
            return this._private__options.maxBarSpacing;
        }
        else {
            // half of the width is default value for maximum bar spacing
            return this._private__width * 0.5;
        }
    }
    _private__minBarSpacing() {
        // if both options are enabled then limit bar spacing so that zooming-out is not possible
        // if it would cause either the first or last points to move too far from an edge
        if (this._private__options.fixLeftEdge && this._private__options.fixRightEdge && this._private__points.length !== 0) {
            return this._private__width / this._private__points.length;
        }
        return this._private__options.minBarSpacing;
    }
    _private__correctOffset() {
        // block scrolling of to past
        const minRightOffset = this._private__minRightOffset();
        if (minRightOffset !== null && this._private__rightOffset < minRightOffset) {
            this._private__rightOffset = minRightOffset;
            this._private__visibleRangeInvalidated = true;
        }
        // block scrolling of to future
        const maxRightOffset = this._private__maxRightOffset();
        if (this._private__rightOffset > maxRightOffset) {
            this._private__rightOffset = maxRightOffset;
            this._private__visibleRangeInvalidated = true;
        }
    }
    _private__minRightOffset() {
        const firstIndex = this._private__firstIndex();
        const baseIndex = this._private__baseIndexOrNull;
        if (firstIndex === null || baseIndex === null) {
            return null;
        }
        const barsEstimation = this._private__options.fixLeftEdge
            ? this._private__width / this._private__barSpacing
            : Math.min(2 /* Constants.MinVisibleBarsCount */, this._private__points.length);
        return firstIndex - baseIndex - 1 + barsEstimation;
    }
    _private__maxRightOffset() {
        return this._private__options.fixRightEdge
            ? 0
            : (this._private__width / this._private__barSpacing) - Math.min(2 /* Constants.MinVisibleBarsCount */, this._private__points.length);
    }
    _private__saveCommonTransitionsStartState() {
        this._private__commonTransitionStartState = {
            _internal_barSpacing: this._internal_barSpacing(),
            _internal_rightOffset: this._internal_rightOffset(),
        };
    }
    _private__clearCommonTransitionsStartState() {
        this._private__commonTransitionStartState = null;
    }
    _private__formatLabel(tickMark) {
        let formatter = this._private__formattedByWeight.get(tickMark.weight);
        if (formatter === undefined) {
            formatter = new FormattedLabelsCache((mark) => {
                return this._private__formatLabelImpl(mark);
            }, this._private__horzScaleBehavior);
            this._private__formattedByWeight.set(tickMark.weight, formatter);
        }
        return formatter._internal_format(tickMark);
    }
    _private__formatLabelImpl(tickMark) {
        return this._private__horzScaleBehavior.formatTickmark(tickMark, this._private__localizationOptions);
    }
    _private__setVisibleRange(newVisibleRange) {
        const oldVisibleRange = this._private__visibleRange;
        this._private__visibleRange = newVisibleRange;
        if (!areRangesEqual(oldVisibleRange._internal_strictRange(), this._private__visibleRange._internal_strictRange())) {
            this._private__visibleBarsChanged._internal_fire();
        }
        if (!areRangesEqual(oldVisibleRange._internal_logicalRange(), this._private__visibleRange._internal_logicalRange())) {
            this._private__logicalRangeChanged._internal_fire();
        }
        // TODO: reset only coords in case when this._visibleBars has not been changed
        this._private__resetTimeMarksCache();
    }
    _private__resetTimeMarksCache() {
        this._private__timeMarksCache = null;
    }
    _private__invalidateTickMarks() {
        this._private__resetTimeMarksCache();
        this._private__formattedByWeight.clear();
    }
    _private__updateDateTimeFormatter() {
        this._private__horzScaleBehavior.updateFormatter(this._private__localizationOptions);
    }
    _private__doFixLeftEdge() {
        if (!this._private__options.fixLeftEdge) {
            return;
        }
        const firstIndex = this._private__firstIndex();
        if (firstIndex === null) {
            return;
        }
        const visibleRange = this._internal_visibleStrictRange();
        if (visibleRange === null) {
            return;
        }
        const delta = visibleRange._internal_left() - firstIndex;
        if (delta < 0) {
            const leftEdgeOffset = this._private__rightOffset - delta - 1;
            this._internal_setRightOffset(leftEdgeOffset);
        }
        this._private__correctBarSpacing();
    }
    _private__doFixRightEdge() {
        this._private__correctOffset();
        this._private__correctBarSpacing();
    }
    _private__shouldConsiderIndex(index) {
        if (!this._private__options.ignoreWhitespaceIndices) {
            return true;
        }
        return this._private__indicesWithData.get(index) || false;
    }
    _private__findNearestIndexWithData(x) {
        const gen = testNearestIntegers(x);
        const maxIndex = this._private__lastIndex();
        while (maxIndex) {
            const index = gen.next().value;
            if (this._private__indicesWithData.get(index)) {
                return index;
            }
            if (index < 0 || index > maxIndex) {
                break;
            }
        }
        return x; // fallback to original index
    }
}
function* testNearestIntegers(num) {
    const rounded = Math.round(num);
    const isRoundedDown = rounded < num;
    let offset = 1;
    while (true) {
        if (isRoundedDown) {
            yield rounded + offset;
            yield rounded - offset;
        }
        else {
            yield rounded - offset;
            yield rounded + offset;
        }
        offset++;
    }
}

/// <reference types="_build-time-constants" />
/**
 * Determine how to exit the tracking mode.
 *
 * By default, mobile users will long press to deactivate the scroll and have the ability to check values and dates.
 * Another press is required to activate the scroll, be able to move left/right, zoom, etc.
 */
var TrackingModeExitMode;
(function (TrackingModeExitMode) {
    /**
     * Tracking Mode will be deactivated on touch end event.
     */
    TrackingModeExitMode[TrackingModeExitMode["OnTouchEnd"] = 0] = "OnTouchEnd";
    /**
     * Tracking Mode will be deactivated on the next tap event.
     */
    TrackingModeExitMode[TrackingModeExitMode["OnNextTap"] = 1] = "OnNextTap";
})(TrackingModeExitMode || (TrackingModeExitMode = {}));
function isPanePrimitive(source) {
    return source instanceof Pane;
}
class ChartModel {
    constructor(invalidateHandler, options, horzScaleBehavior) {
        this._private__panes = [];
        this._private__serieses = [];
        this._private__width = 0;
        this._private__hoveredSource = null;
        this._private__priceScalesOptionsChanged = new Delegate();
        this._private__crosshairMoved = new Delegate();
        this._private__gradientColorsCache = null;
        this._private__invalidateHandler = invalidateHandler;
        this._private__options = options;
        this._private__horzScaleBehavior = horzScaleBehavior;
        this._private__colorParser = new ColorParser(this._private__options.layout.colorParsers);
        this._private__rendererOptionsProvider = new PriceAxisRendererOptionsProvider(this);
        this._private__timeScale = new TimeScale(this, options.timeScale, this._private__options.localization, horzScaleBehavior);
        this._private__crosshair = new Crosshair(this, options.crosshair);
        this._private__magnet = new Magnet(options.crosshair);
        this._private__getOrCreatePane(0);
        this._private__panes[0]._internal_setStretchFactor(DEFAULT_STRETCH_FACTOR * 2);
        this._private__backgroundTopColor = this._private__getBackgroundColor(0 /* BackgroundColorSide.Top */);
        this._private__backgroundBottomColor = this._private__getBackgroundColor(1 /* BackgroundColorSide.Bottom */);
    }
    _internal_fullUpdate() {
        this._private__invalidate(InvalidateMask._internal_full());
    }
    _internal_lightUpdate() {
        this._private__invalidate(InvalidateMask._internal_light());
    }
    _internal_cursorUpdate() {
        this._private__invalidate(new InvalidateMask(1 /* InvalidationLevel.Cursor */));
    }
    _internal_updateSource(source) {
        const inv = this._private__invalidationMaskForSource(source);
        this._private__invalidate(inv);
    }
    _internal_hoveredSource() {
        return this._private__hoveredSource;
    }
    _internal_setHoveredSource(source) {
        if (this._private__hoveredSource?._internal_source === source?._internal_source && this._private__hoveredSource?._internal_object?._internal_externalId === source?._internal_object?._internal_externalId) {
            return;
        }
        const prevSource = this._private__hoveredSource;
        this._private__hoveredSource = source;
        if (prevSource !== null) {
            this._internal_updateSource(prevSource._internal_source);
        }
        // additional check to prevent unnecessary updates of same source
        if (source !== null && source._internal_source !== prevSource?._internal_source) {
            this._internal_updateSource(source._internal_source);
        }
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_applyOptions(options) {
        merge(this._private__options, options);
        this._private__panes.forEach((p) => p._internal_applyScaleOptions(options));
        if (options.timeScale !== undefined) {
            this._private__timeScale._internal_applyOptions(options.timeScale);
        }
        if (options.localization !== undefined) {
            this._private__timeScale._internal_applyLocalizationOptions(options.localization);
        }
        if (options.leftPriceScale || options.rightPriceScale) {
            this._private__priceScalesOptionsChanged._internal_fire();
        }
        this._private__backgroundTopColor = this._private__getBackgroundColor(0 /* BackgroundColorSide.Top */);
        this._private__backgroundBottomColor = this._private__getBackgroundColor(1 /* BackgroundColorSide.Bottom */);
        this._internal_fullUpdate();
    }
    _internal_applyPriceScaleOptions(priceScaleId, options, paneIndex = 0) {
        const pane = this._private__panes[paneIndex];
        if (pane === undefined) {
            {
                throw new Error(`Trying to apply price scale options with incorrect pane index: ${paneIndex}`);
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (priceScaleId === "left" /* DefaultPriceScaleId.Left */) {
            merge(this._private__options, {
                leftPriceScale: options,
            });
            pane._internal_applyScaleOptions({
                leftPriceScale: options,
            });
            this._private__priceScalesOptionsChanged._internal_fire();
            this._internal_fullUpdate();
            return;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        }
        else if (priceScaleId === "right" /* DefaultPriceScaleId.Right */) {
            merge(this._private__options, {
                rightPriceScale: options,
            });
            pane._internal_applyScaleOptions({
                rightPriceScale: options,
            });
            this._private__priceScalesOptionsChanged._internal_fire();
            this._internal_fullUpdate();
            return;
        }
        const res = this._internal_findPriceScale(priceScaleId, paneIndex);
        if (res === null) {
            {
                throw new Error(`Trying to apply price scale options with incorrect ID: ${priceScaleId}`);
            }
        }
        res._internal_priceScale._internal_applyOptions(options);
        this._private__priceScalesOptionsChanged._internal_fire();
    }
    _internal_findPriceScale(priceScaleId, paneIndex) {
        const pane = this._private__panes[paneIndex];
        if (pane === undefined) {
            return null;
        }
        const priceScale = pane._internal_priceScaleById(priceScaleId);
        if (priceScale !== null) {
            return {
                _internal_pane: pane,
                _internal_priceScale: priceScale,
            };
        }
        return null;
    }
    _internal_timeScale() {
        return this._private__timeScale;
    }
    _internal_panes() {
        return this._private__panes;
    }
    _internal_crosshairSource() {
        return this._private__crosshair;
    }
    _internal_crosshairMoved() {
        return this._private__crosshairMoved;
    }
    _internal_setPaneHeight(pane, height) {
        pane._internal_setHeight(height);
        this._internal_recalculateAllPanes();
    }
    _internal_setWidth(width) {
        this._private__width = width;
        this._private__timeScale._internal_setWidth(this._private__width);
        this._private__panes.forEach((pane) => pane._internal_setWidth(width));
        this._internal_recalculateAllPanes();
    }
    _internal_removePane(index) {
        if (this._private__panes.length === 1) {
            return;
        }
        assert(index >= 0 && index < this._private__panes.length, 'Invalid pane index');
        this._private__panes.splice(index, 1);
        this._internal_fullUpdate();
    }
    _internal_changePanesHeight(paneIndex, height) {
        if (this._private__panes.length < 2) {
            return;
        }
        assert(paneIndex >= 0 && paneIndex < this._private__panes.length, 'Invalid pane index');
        const targetPane = this._private__panes[paneIndex];
        const totalStretch = this._private__panes.reduce((prevValue, pane) => prevValue + pane._internal_stretchFactor(), 0);
        const totalHeight = this._private__panes.reduce((prevValue, pane) => prevValue + pane._internal_height(), 0);
        const maxPaneHeight = totalHeight - MIN_PANE_HEIGHT * (this._private__panes.length - 1);
        height = Math.min(maxPaneHeight, Math.max(MIN_PANE_HEIGHT, height));
        const pixelStretchFactor = totalStretch / totalHeight;
        const oldHeight = targetPane._internal_height();
        targetPane._internal_setStretchFactor(height * pixelStretchFactor);
        let otherPanesChange = height - oldHeight;
        let panesCount = this._private__panes.length - 1;
        for (const pane of this._private__panes) {
            if (pane !== targetPane) {
                const newPaneHeight = Math.min(maxPaneHeight, Math.max(30, pane._internal_height() - otherPanesChange / panesCount));
                otherPanesChange -= (pane._internal_height() - newPaneHeight);
                panesCount -= 1;
                const newStretchFactor = newPaneHeight * pixelStretchFactor;
                pane._internal_setStretchFactor(newStretchFactor);
            }
        }
        this._internal_fullUpdate();
    }
    _internal_swapPanes(first, second) {
        assert(first >= 0 && first < this._private__panes.length && second >= 0 && second < this._private__panes.length, 'Invalid pane index');
        const firstPane = this._private__panes[first];
        const secondPane = this._private__panes[second];
        this._private__panes[first] = secondPane;
        this._private__panes[second] = firstPane;
        this._internal_fullUpdate();
    }
    _internal_startScalePrice(pane, priceScale, x) {
        pane._internal_startScalePrice(priceScale, x);
    }
    _internal_scalePriceTo(pane, priceScale, x) {
        pane._internal_scalePriceTo(priceScale, x);
        this._internal_updateCrosshair();
        this._private__invalidate(this._private__paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    _internal_endScalePrice(pane, priceScale) {
        pane._internal_endScalePrice(priceScale);
        this._private__invalidate(this._private__paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    _internal_startScrollPrice(pane, priceScale, x) {
        if (priceScale._internal_isAutoScale()) {
            return;
        }
        pane._internal_startScrollPrice(priceScale, x);
    }
    _internal_scrollPriceTo(pane, priceScale, x) {
        if (priceScale._internal_isAutoScale()) {
            return;
        }
        pane._internal_scrollPriceTo(priceScale, x);
        this._internal_updateCrosshair();
        this._private__invalidate(this._private__paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    _internal_endScrollPrice(pane, priceScale) {
        if (priceScale._internal_isAutoScale()) {
            return;
        }
        pane._internal_endScrollPrice(priceScale);
        this._private__invalidate(this._private__paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    _internal_resetPriceScale(pane, priceScale) {
        pane._internal_resetPriceScale(priceScale);
        this._private__invalidate(this._private__paneInvalidationMask(pane, 2 /* InvalidationLevel.Light */));
    }
    _internal_startScaleTime(position) {
        this._private__timeScale._internal_startScale(position);
    }
    /**
     * Zoom in/out the chart (depends on scale value).
     *
     * @param pointX - X coordinate of the point to apply the zoom (the point which should stay on its place)
     * @param scale - Zoom value. Negative value means zoom out, positive - zoom in.
     */
    _internal_zoomTime(pointX, scale) {
        const timeScale = this._internal_timeScale();
        if (timeScale._internal_isEmpty() || scale === 0) {
            return;
        }
        const timeScaleWidth = timeScale._internal_width();
        pointX = Math.max(1, Math.min(pointX, timeScaleWidth));
        timeScale._internal_zoom(pointX, scale);
        this._internal_recalculateAllPanes();
    }
    _internal_scrollChart(x) {
        this._internal_startScrollTime(0);
        this._internal_scrollTimeTo(x);
        this._internal_endScrollTime();
    }
    _internal_scaleTimeTo(x) {
        this._private__timeScale._internal_scaleTo(x);
        this._internal_recalculateAllPanes();
    }
    _internal_endScaleTime() {
        this._private__timeScale._internal_endScale();
        this._internal_lightUpdate();
    }
    _internal_startScrollTime(x) {
        this._private__timeScale._internal_startScroll(x);
    }
    _internal_scrollTimeTo(x) {
        this._private__timeScale._internal_scrollTo(x);
        this._internal_recalculateAllPanes();
    }
    _internal_endScrollTime() {
        this._private__timeScale._internal_endScroll();
        this._internal_lightUpdate();
    }
    _internal_serieses() {
        return this._private__serieses;
    }
    _internal_setAndSaveCurrentPosition(x, y, event, pane, skipEvent) {
        this._private__crosshair._internal_saveOriginCoord(x, y);
        let price = NaN;
        let index = this._private__timeScale._internal_coordinateToIndex(x, true);
        const visibleBars = this._private__timeScale._internal_visibleStrictRange();
        if (visibleBars !== null) {
            index = Math.min(Math.max(visibleBars._internal_left(), index), visibleBars._internal_right());
        }
        const priceScale = pane._internal_defaultPriceScale();
        const firstValue = priceScale._internal_firstValue();
        if (firstValue !== null) {
            price = priceScale._internal_coordinateToPrice(y, firstValue);
        }
        price = this._private__magnet._internal_align(price, index, pane);
        this._private__crosshair._internal_setPosition(index, price, pane);
        this._internal_cursorUpdate();
        if (!skipEvent) {
            const hitTest = hitTestPane(pane, x, y);
            this._internal_setHoveredSource(hitTest && { _internal_source: hitTest._internal_source, _internal_object: hitTest._internal_object, _internal_cursorStyle: hitTest._internal_cursorStyle || null });
            this._private__crosshairMoved._internal_fire(this._private__crosshair._internal_appliedIndex(), { x, y }, event);
        }
    }
    // A position provided external (not from an internal event listener)
    _internal_setAndSaveSyntheticPosition(price, horizontalPosition, pane) {
        const priceScale = pane._internal_defaultPriceScale();
        const firstValue = priceScale._internal_firstValue();
        const y = priceScale._internal_priceToCoordinate(price, ensureNotNull(firstValue));
        const index = this._private__timeScale._internal_timeToIndex(horizontalPosition, true);
        const x = this._private__timeScale._internal_indexToCoordinate(ensureNotNull(index));
        this._internal_setAndSaveCurrentPosition(x, y, null, pane, true);
    }
    _internal_clearCurrentPosition(skipEvent) {
        const crosshair = this._internal_crosshairSource();
        crosshair._internal_clearPosition();
        this._internal_cursorUpdate();
        if (!skipEvent) {
            this._private__crosshairMoved._internal_fire(null, null, null);
        }
    }
    _internal_updateCrosshair() {
        // apply magnet
        const pane = this._private__crosshair._internal_pane();
        if (pane !== null) {
            const x = this._private__crosshair._internal_originCoordX();
            const y = this._private__crosshair._internal_originCoordY();
            this._internal_setAndSaveCurrentPosition(x, y, null, pane);
        }
        this._private__crosshair._internal_updateAllViews();
    }
    _internal_updateTimeScale(newBaseIndex, newPoints, firstChangedPointIndex) {
        const oldFirstTime = this._private__timeScale._internal_indexToTime(0);
        if (newPoints !== undefined && firstChangedPointIndex !== undefined) {
            this._private__timeScale._internal_update(newPoints, firstChangedPointIndex);
        }
        const newFirstTime = this._private__timeScale._internal_indexToTime(0);
        const currentBaseIndex = this._private__timeScale._internal_baseIndex();
        const visibleBars = this._private__timeScale._internal_visibleStrictRange();
        // if time scale cannot return current visible bars range (e.g. time scale has zero-width)
        // then we do not need to update right offset to shift visible bars range to have the same right offset as we have before new bar
        // (and actually we cannot)
        if (visibleBars !== null && oldFirstTime !== null && newFirstTime !== null) {
            const isLastSeriesBarVisible = visibleBars._internal_contains(currentBaseIndex);
            const isLeftBarShiftToLeft = this._private__horzScaleBehavior.key(oldFirstTime) > this._private__horzScaleBehavior.key(newFirstTime);
            const isSeriesPointsAdded = newBaseIndex !== null && newBaseIndex > currentBaseIndex;
            const isSeriesPointsAddedToRight = isSeriesPointsAdded && !isLeftBarShiftToLeft;
            const allowShiftWhenReplacingWhitespace = this._private__timeScale._internal_options().allowShiftVisibleRangeOnWhitespaceReplacement;
            const replacedExistingWhitespace = firstChangedPointIndex === undefined;
            const needShiftVisibleRangeOnNewBar = isLastSeriesBarVisible && (!replacedExistingWhitespace || allowShiftWhenReplacingWhitespace) && this._private__timeScale._internal_options().shiftVisibleRangeOnNewBar;
            if (isSeriesPointsAddedToRight && !needShiftVisibleRangeOnNewBar) {
                const compensationShift = newBaseIndex - currentBaseIndex;
                this._private__timeScale._internal_setRightOffset(this._private__timeScale._internal_rightOffset() - compensationShift);
            }
        }
        this._private__timeScale._internal_setBaseIndex(newBaseIndex);
    }
    _internal_recalculatePane(pane) {
        if (pane !== null) {
            pane._internal_recalculate();
        }
    }
    _internal_paneForSource(source) {
        if (isPanePrimitive(source)) {
            return source;
        }
        const pane = this._private__panes.find((p) => p._internal_orderedSources().includes(source));
        return pane === undefined ? null : pane;
    }
    _internal_recalculateAllPanes() {
        this._private__panes.forEach((p) => p._internal_recalculate());
        this._internal_updateCrosshair();
    }
    _internal_destroy() {
        this._private__panes.forEach((p) => p._internal_destroy());
        this._private__panes.length = 0;
        // to avoid memleaks
        this._private__options.localization.priceFormatter = undefined;
        this._private__options.localization.percentageFormatter = undefined;
        this._private__options.localization.timeFormatter = undefined;
    }
    _internal_rendererOptionsProvider() {
        return this._private__rendererOptionsProvider;
    }
    _internal_priceAxisRendererOptions() {
        return this._private__rendererOptionsProvider._internal_options();
    }
    _internal_priceScalesOptionsChanged() {
        return this._private__priceScalesOptionsChanged;
    }
    _internal_addSeriesToPane(series, paneIndex) {
        const pane = this._private__getOrCreatePane(paneIndex);
        this._private__addSeriesToPane(series, pane);
        this._private__serieses.push(series);
        if (this._private__serieses.length === 1) {
            // call fullUpdate to recalculate chart's parts geometry
            this._internal_fullUpdate();
        }
        else {
            this._internal_lightUpdate();
        }
    }
    _internal_removeSeries(series) {
        const pane = this._internal_paneForSource(series);
        const seriesIndex = this._private__serieses.indexOf(series);
        assert(seriesIndex !== -1, 'Series not found');
        const paneImpl = ensureNotNull(pane);
        this._private__serieses.splice(seriesIndex, 1);
        paneImpl._internal_removeDataSource(series);
        if (series._internal_destroy) {
            series._internal_destroy();
        }
        this._private__timeScale._internal_recalculateIndicesWithData();
        this._private__cleanupIfPaneIsEmpty(paneImpl);
    }
    _internal_moveSeriesToScale(series, targetScaleId) {
        const pane = ensureNotNull(this._internal_paneForSource(series));
        pane._internal_removeDataSource(series);
        pane._internal_addDataSource(series, targetScaleId, ensureNotNull(series._internal_zorder()));
    }
    _internal_fitContent() {
        const mask = InvalidateMask._internal_light();
        mask._internal_setFitContent();
        this._private__invalidate(mask);
    }
    _internal_setTargetLogicalRange(range) {
        const mask = InvalidateMask._internal_light();
        mask._internal_applyRange(range);
        this._private__invalidate(mask);
    }
    _internal_resetTimeScale() {
        const mask = InvalidateMask._internal_light();
        mask._internal_resetTimeScale();
        this._private__invalidate(mask);
    }
    _internal_setBarSpacing(spacing) {
        const mask = InvalidateMask._internal_light();
        mask._internal_setBarSpacing(spacing);
        this._private__invalidate(mask);
    }
    _internal_setRightOffset(offset) {
        const mask = InvalidateMask._internal_light();
        mask._internal_setRightOffset(offset);
        this._private__invalidate(mask);
    }
    _internal_setTimeScaleAnimation(animation) {
        const mask = InvalidateMask._internal_light();
        mask._internal_setTimeScaleAnimation(animation);
        this._private__invalidate(mask);
    }
    _internal_stopTimeScaleAnimation() {
        const mask = InvalidateMask._internal_light();
        mask._internal_stopTimeScaleAnimation();
        this._private__invalidate(mask);
    }
    _internal_defaultVisiblePriceScaleId() {
        return this._private__options.rightPriceScale.visible ? "right" /* DefaultPriceScaleId.Right */ : "left" /* DefaultPriceScaleId.Left */;
    }
    _internal_moveSeriesToPane(series, newPaneIndex) {
        assert(newPaneIndex >= 0, 'Index should be greater or equal to 0');
        const fromPaneIndex = this._private__seriesPaneIndex(series);
        if (newPaneIndex === fromPaneIndex) {
            return;
        }
        const previousPane = ensureNotNull(this._internal_paneForSource(series));
        previousPane._internal_removeDataSource(series);
        const newPane = this._private__getOrCreatePane(newPaneIndex);
        this._private__addSeriesToPane(series, newPane);
        if (previousPane._internal_dataSources().length === 0) {
            this._private__cleanupIfPaneIsEmpty(previousPane);
        }
    }
    _internal_backgroundBottomColor() {
        return this._private__backgroundBottomColor;
    }
    _internal_backgroundTopColor() {
        return this._private__backgroundTopColor;
    }
    _internal_backgroundColorAtYPercentFromTop(percent) {
        const bottomColor = this._private__backgroundBottomColor;
        const topColor = this._private__backgroundTopColor;
        if (bottomColor === topColor) {
            // solid background
            return bottomColor;
        }
        // gradient background
        // percent should be from 0 to 100 (we're using only integer values to make cache more efficient)
        percent = Math.max(0, Math.min(100, Math.round(percent * 100)));
        if (this._private__gradientColorsCache === null ||
            this._private__gradientColorsCache._internal_topColor !== topColor || this._private__gradientColorsCache._internal_bottomColor !== bottomColor) {
            this._private__gradientColorsCache = {
                _internal_topColor: topColor,
                _internal_bottomColor: bottomColor,
                _internal_colors: new Map(),
            };
        }
        else {
            const cachedValue = this._private__gradientColorsCache._internal_colors.get(percent);
            if (cachedValue !== undefined) {
                return cachedValue;
            }
        }
        const result = this._private__colorParser._internal_gradientColorAtPercent(topColor, bottomColor, percent / 100);
        this._private__gradientColorsCache._internal_colors.set(percent, result);
        return result;
    }
    _internal_getPaneIndex(pane) {
        return this._private__panes.indexOf(pane);
    }
    _internal_colorParser() {
        return this._private__colorParser;
    }
    _private__getOrCreatePane(index) {
        assert(index >= 0, 'Index should be greater or equal to 0');
        index = Math.min(this._private__panes.length, index);
        if (index < this._private__panes.length) {
            return this._private__panes[index];
        }
        const pane = new Pane(this._private__timeScale, this);
        this._private__panes.push(pane);
        // we always do autoscaling on the creation
        // if autoscale option is true, it is ok, just recalculate by invalidation mask
        // if autoscale option is false, autoscale anyway on the first draw
        // also there is a scenario when autoscale is true in constructor and false later on applyOptions
        const mask = InvalidateMask._internal_full();
        mask._internal_invalidatePane(index, {
            _internal_level: 0 /* InvalidationLevel.None */,
            _internal_autoScale: true,
        });
        this._private__invalidate(mask);
        return pane;
    }
    _private__seriesPaneIndex(series) {
        return this._private__panes.findIndex((pane) => pane._internal_series().includes(series));
    }
    _private__paneInvalidationMask(pane, level) {
        const inv = new InvalidateMask(level);
        if (pane !== null) {
            const index = this._private__panes.indexOf(pane);
            inv._internal_invalidatePane(index, {
                _internal_level: level,
            });
        }
        return inv;
    }
    _private__invalidationMaskForSource(source, invalidateType) {
        if (invalidateType === undefined) {
            invalidateType = 2 /* InvalidationLevel.Light */;
        }
        return this._private__paneInvalidationMask(this._internal_paneForSource(source), invalidateType);
    }
    _private__invalidate(mask) {
        if (this._private__invalidateHandler) {
            this._private__invalidateHandler(mask);
        }
        this._private__panes.forEach((pane) => pane._internal_grid()._internal_paneView()._internal_update());
    }
    _private__addSeriesToPane(series, pane) {
        const priceScaleId = series._internal_options().priceScaleId;
        const targetScaleId = priceScaleId !== undefined ? priceScaleId : this._internal_defaultVisiblePriceScaleId();
        pane._internal_addDataSource(series, targetScaleId);
        if (!isDefaultPriceScale(targetScaleId)) {
            // let's apply that options again to apply margins
            series._internal_applyOptions(series._internal_options());
        }
    }
    _private__getBackgroundColor(side) {
        const layoutOptions = this._private__options['layout'];
        if (layoutOptions.background.type === "gradient" /* ColorType.VerticalGradient */) {
            return side === 0 /* BackgroundColorSide.Top */ ?
                layoutOptions.background.topColor :
                layoutOptions.background.bottomColor;
        }
        return layoutOptions.background.color;
    }
    _private__cleanupIfPaneIsEmpty(pane) {
        if (pane._internal_dataSources().length === 0 && this._private__panes.length > 1) {
            this._private__panes.splice(this._internal_getPaneIndex(pane), 1);
            this._internal_fullUpdate();
        }
    }
}

function fillUpDownCandlesticksColors(options) {
    if (options.borderColor !== undefined) {
        options.borderUpColor = options.borderColor;
        options.borderDownColor = options.borderColor;
    }
    if (options.wickColor !== undefined) {
        options.wickUpColor = options.wickColor;
        options.wickDownColor = options.wickColor;
    }
}
/**
 * Represents the type of the last price animation for series such as area or line.
 */
var LastPriceAnimationMode;
(function (LastPriceAnimationMode) {
    /**
     * Animation is always disabled
     */
    LastPriceAnimationMode[LastPriceAnimationMode["Disabled"] = 0] = "Disabled";
    /**
     * Animation is always enabled.
     */
    LastPriceAnimationMode[LastPriceAnimationMode["Continuous"] = 1] = "Continuous";
    /**
     * Animation is active after new data.
     */
    LastPriceAnimationMode[LastPriceAnimationMode["OnDataUpdate"] = 2] = "OnDataUpdate";
})(LastPriceAnimationMode || (LastPriceAnimationMode = {}));
function precisionByMinMove(minMove) {
    if (minMove >= 1) {
        return 0;
    }
    let i = 0;
    for (; i < 8; i++) {
        const intPart = Math.round(minMove);
        const fractPart = Math.abs(intPart - minMove);
        if (fractPart < 1e-8) {
            return i;
        }
        minMove = minMove * 10;
    }
    return i;
}
/**
 * Represents the source of data to be used for the horizontal price line.
 */
var PriceLineSource;
(function (PriceLineSource) {
    /**
     * Use the last bar data.
     */
    PriceLineSource[PriceLineSource["LastBar"] = 0] = "LastBar";
    /**
     * Use the last visible data of the chart viewport.
     */
    PriceLineSource[PriceLineSource["LastVisible"] = 1] = "LastVisible";
})(PriceLineSource || (PriceLineSource = {}));

/**
 * Represents a type of color.
 */
var ColorType;
(function (ColorType) {
    /** Solid color */
    ColorType["Solid"] = "solid";
    /** Vertical gradient color */
    ColorType["VerticalGradient"] = "gradient";
})(ColorType || (ColorType = {}));

/**
 * Check if a time value is a business day object.
 *
 * @param time - The time to check.
 * @returns `true` if `time` is a {@link BusinessDay} object, false otherwise.
 */
function isBusinessDay(time) {
    return !isNumber(time) && !isString(time);
}
/**
 * Check if a time value is a UTC timestamp number.
 *
 * @param time - The time to check.
 * @returns `true` if `time` is a {@link UTCTimestamp} number, false otherwise.
 */
function isUTCTimestamp(time) {
    return isNumber(time);
}
/**
 * Represents the type of a tick mark on the time axis.
 */
var TickMarkType;
(function (TickMarkType) {
    /**
     * The start of the year (e.g. it's the first tick mark in a year).
     */
    TickMarkType[TickMarkType["Year"] = 0] = "Year";
    /**
     * The start of the month (e.g. it's the first tick mark in a month).
     */
    TickMarkType[TickMarkType["Month"] = 1] = "Month";
    /**
     * A day of the month.
     */
    TickMarkType[TickMarkType["DayOfMonth"] = 2] = "DayOfMonth";
    /**
     * A time without seconds.
     */
    TickMarkType[TickMarkType["Time"] = 3] = "Time";
    /**
     * A time with seconds.
     */
    TickMarkType[TickMarkType["TimeWithSeconds"] = 4] = "TimeWithSeconds";
})(TickMarkType || (TickMarkType = {}));

const getMonth = (date) => date.getUTCMonth() + 1;
const getDay = (date) => date.getUTCDate();
const getYear = (date) => date.getUTCFullYear();
const dd = (date) => numberToStringWithLeadingZero(getDay(date), 2);
const MMMM = (date, locale) => new Date(date.getUTCFullYear(), date.getUTCMonth(), 1)
    .toLocaleString(locale, { month: 'long' });
const MMM = (date, locale) => new Date(date.getUTCFullYear(), date.getUTCMonth(), 1)
    .toLocaleString(locale, { month: 'short' });
const MM = (date) => numberToStringWithLeadingZero(getMonth(date), 2);
const yy = (date) => numberToStringWithLeadingZero(getYear(date) % 100, 2);
const yyyy = (date) => numberToStringWithLeadingZero(getYear(date), 4);
function formatDate(date, format, locale) {
    return format
        .replace(/yyyy/g, yyyy(date))
        .replace(/yy/g, yy(date))
        .replace(/MMMM/g, MMMM(date, locale))
        .replace(/MMM/g, MMM(date, locale))
        .replace(/MM/g, MM(date))
        .replace(/dd/g, dd(date));
}

class DateFormatter {
    constructor(dateFormat = 'yyyy-MM-dd', locale = 'default') {
        this._private__dateFormat = dateFormat;
        this._private__locale = locale;
    }
    _internal_format(date) {
        return formatDate(date, this._private__dateFormat, this._private__locale);
    }
}

class TimeFormatter {
    constructor(format) {
        this._private__formatStr = format || '%h:%m:%s';
    }
    _internal_format(date) {
        return this._private__formatStr.replace('%h', numberToStringWithLeadingZero(date.getUTCHours(), 2)).
            replace('%m', numberToStringWithLeadingZero(date.getUTCMinutes(), 2)).
            replace('%s', numberToStringWithLeadingZero(date.getUTCSeconds(), 2));
    }
}

const defaultParams = {
    _internal_dateFormat: 'yyyy-MM-dd',
    _internal_timeFormat: '%h:%m:%s',
    _internal_dateTimeSeparator: ' ',
    _internal_locale: 'default',
};
class DateTimeFormatter {
    constructor(params = {}) {
        const formatterParams = { ...defaultParams, ...params };
        this._private__dateFormatter = new DateFormatter(formatterParams._internal_dateFormat, formatterParams._internal_locale);
        this._private__timeFormatter = new TimeFormatter(formatterParams._internal_timeFormat);
        this._private__separator = formatterParams._internal_dateTimeSeparator;
    }
    _internal_format(dateTime) {
        return `${this._private__dateFormatter._internal_format(dateTime)}${this._private__separator}${this._private__timeFormatter._internal_format(dateTime)}`;
    }
}

function defaultTickMarkFormatter(timePoint, tickMarkType, locale) {
    const formatOptions = {};
    switch (tickMarkType) {
        case 0 /* TickMarkType.Year */:
            formatOptions.year = 'numeric';
            break;
        case 1 /* TickMarkType.Month */:
            formatOptions.month = 'short';
            break;
        case 2 /* TickMarkType.DayOfMonth */:
            formatOptions.day = 'numeric';
            break;
        case 3 /* TickMarkType.Time */:
            formatOptions.hour12 = false;
            formatOptions.hour = '2-digit';
            formatOptions.minute = '2-digit';
            break;
        case 4 /* TickMarkType.TimeWithSeconds */:
            formatOptions.hour12 = false;
            formatOptions.hour = '2-digit';
            formatOptions.minute = '2-digit';
            formatOptions.second = '2-digit';
            break;
    }
    const date = timePoint._internal_businessDay === undefined
        ? new Date(timePoint._internal_timestamp * 1000)
        : new Date(Date.UTC(timePoint._internal_businessDay.year, timePoint._internal_businessDay.month - 1, timePoint._internal_businessDay.day));
    // from given date we should use only as UTC date or timestamp
    // but to format as locale date we can convert UTC date to local date
    const localDateFromUtc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
    return localDateFromUtc.toLocaleString(locale, formatOptions);
}

function hours(count) {
    return count * 60 * 60 * 1000;
}
function minutes(count) {
    return count * 60 * 1000;
}
function seconds(count) {
    return count * 1000;
}
const intradayWeightDivisors = [
    { _internal_divisor: seconds(1), _internal_weight: 10 /* TickMarkWeight.Second */ },
    { _internal_divisor: minutes(1), _internal_weight: 20 /* TickMarkWeight.Minute1 */ },
    { _internal_divisor: minutes(5), _internal_weight: 21 /* TickMarkWeight.Minute5 */ },
    { _internal_divisor: minutes(30), _internal_weight: 22 /* TickMarkWeight.Minute30 */ },
    { _internal_divisor: hours(1), _internal_weight: 30 /* TickMarkWeight.Hour1 */ },
    { _internal_divisor: hours(3), _internal_weight: 31 /* TickMarkWeight.Hour3 */ },
    { _internal_divisor: hours(6), _internal_weight: 32 /* TickMarkWeight.Hour6 */ },
    { _internal_divisor: hours(12), _internal_weight: 33 /* TickMarkWeight.Hour12 */ },
];
function weightByTime(currentDate, prevDate) {
    if (currentDate.getUTCFullYear() !== prevDate.getUTCFullYear()) {
        return 70 /* TickMarkWeight.Year */;
    }
    else if (currentDate.getUTCMonth() !== prevDate.getUTCMonth()) {
        return 60 /* TickMarkWeight.Month */;
    }
    else if (currentDate.getUTCDate() !== prevDate.getUTCDate()) {
        return 50 /* TickMarkWeight.Day */;
    }
    for (let i = intradayWeightDivisors.length - 1; i >= 0; --i) {
        if (Math.floor(prevDate.getTime() / intradayWeightDivisors[i]._internal_divisor) !== Math.floor(currentDate.getTime() / intradayWeightDivisors[i]._internal_divisor)) {
            return intradayWeightDivisors[i]._internal_weight;
        }
    }
    return 0 /* TickMarkWeight.LessThanSecond */;
}
function cast(t) {
    return t;
}
function fillWeightsForPoints(sortedTimePoints, startIndex = 0) {
    if (sortedTimePoints.length === 0) {
        return;
    }
    let prevTime = startIndex === 0 ? null : cast(sortedTimePoints[startIndex - 1].time)._internal_timestamp;
    let prevDate = prevTime !== null ? new Date(prevTime * 1000) : null;
    let totalTimeDiff = 0;
    for (let index = startIndex; index < sortedTimePoints.length; ++index) {
        const currentPoint = sortedTimePoints[index];
        const currentDate = new Date(cast(currentPoint.time)._internal_timestamp * 1000);
        if (prevDate !== null) {
            currentPoint.timeWeight = weightByTime(currentDate, prevDate);
        }
        totalTimeDiff += cast(currentPoint.time)._internal_timestamp - (prevTime || cast(currentPoint.time)._internal_timestamp);
        prevTime = cast(currentPoint.time)._internal_timestamp;
        prevDate = currentDate;
    }
    if (startIndex === 0 && sortedTimePoints.length > 1) {
        // let's guess a weight for the first point
        // let's say the previous point was average time back in the history
        const averageTimeDiff = Math.ceil(totalTimeDiff / (sortedTimePoints.length - 1));
        const approxPrevDate = new Date((cast(sortedTimePoints[0].time)._internal_timestamp - averageTimeDiff) * 1000);
        sortedTimePoints[0].timeWeight = weightByTime(new Date(cast(sortedTimePoints[0].time)._internal_timestamp * 1000), approxPrevDate);
    }
}

function businessDayConverter(time) {
    let businessDay = time;
    if (isString(time)) {
        businessDay = stringToBusinessDay(time);
    }
    if (!isBusinessDay(businessDay)) {
        throw new Error('time must be of type BusinessDay');
    }
    const date = new Date(Date.UTC(businessDay.year, businessDay.month - 1, businessDay.day, 0, 0, 0, 0));
    return {
        _internal_timestamp: Math.round(date.getTime() / 1000),
        _internal_businessDay: businessDay,
    };
}
function timestampConverter(time) {
    if (!isUTCTimestamp(time)) {
        throw new Error('time must be of type isUTCTimestamp');
    }
    return {
        _internal_timestamp: time,
    };
}
function selectTimeConverter(data) {
    if (data.length === 0) {
        return null;
    }
    if (isBusinessDay(data[0].time) || isString(data[0].time)) {
        return businessDayConverter;
    }
    return timestampConverter;
}
const validDateRegex = /^\d\d\d\d-\d\d-\d\d$/;
function convertTime(time) {
    if (isUTCTimestamp(time)) {
        return timestampConverter(time);
    }
    if (!isBusinessDay(time)) {
        return businessDayConverter(stringToBusinessDay(time));
    }
    return businessDayConverter(time);
}
function stringToBusinessDay(value) {
    {
        // in some browsers (I look at your Chrome) the Date constructor may accept invalid date string
        // but parses them in 'implementation specific' way
        // for example 2019-1-1 isn't the same as 2019-01-01 (for Chrome both are 'valid' date strings)
        // see https://bugs.chromium.org/p/chromium/issues/detail?id=968939
        // so, we need to be sure that date has valid format to avoid strange behavior and hours of debugging
        // but let's do this in development build only because of perf
        if (!validDateRegex.test(value)) {
            throw new Error(`Invalid date string=${value}, expected format=yyyy-mm-dd`);
        }
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
        throw new Error(`Invalid date string=${value}, expected format=yyyy-mm-dd`);
    }
    return {
        day: d.getUTCDate(),
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
    };
}
function convertStringToBusinessDay(value) {
    if (isString(value.time)) {
        value.time = stringToBusinessDay(value.time);
    }
}
function convertStringsToBusinessDays(data) {
    return data.forEach(convertStringToBusinessDay);
}

// eslint-disable-next-line complexity
function weightToTickMarkType(weight, timeVisible, secondsVisible) {
    switch (weight) {
        case 0 /* TickMarkWeight.LessThanSecond */:
        case 10 /* TickMarkWeight.Second */:
            return timeVisible
                ? (secondsVisible ? 4 /* TickMarkType.TimeWithSeconds */ : 3 /* TickMarkType.Time */)
                : 2 /* TickMarkType.DayOfMonth */;
        case 20 /* TickMarkWeight.Minute1 */:
        case 21 /* TickMarkWeight.Minute5 */:
        case 22 /* TickMarkWeight.Minute30 */:
        case 30 /* TickMarkWeight.Hour1 */:
        case 31 /* TickMarkWeight.Hour3 */:
        case 32 /* TickMarkWeight.Hour6 */:
        case 33 /* TickMarkWeight.Hour12 */:
            return timeVisible ? 3 /* TickMarkType.Time */ : 2 /* TickMarkType.DayOfMonth */;
        case 50 /* TickMarkWeight.Day */:
            return 2 /* TickMarkType.DayOfMonth */;
        case 60 /* TickMarkWeight.Month */:
            return 1 /* TickMarkType.Month */;
        case 70 /* TickMarkWeight.Year */:
            return 0 /* TickMarkType.Year */;
    }
}
class HorzScaleBehaviorTime {
    options() {
        return this._private__options;
    }
    setOptions(options) {
        this._private__options = options;
        this.updateFormatter(options.localization);
    }
    preprocessData(data) {
        if (Array.isArray(data)) {
            convertStringsToBusinessDays(data);
        }
        else {
            convertStringToBusinessDay(data);
        }
    }
    createConverterToInternalObj(data) {
        return ensureNotNull(selectTimeConverter(data));
    }
    key(item) {
        // eslint-disable-next-line no-restricted-syntax
        if (typeof item === 'object' && "_internal_timestamp" in item) {
            return item._internal_timestamp;
        }
        else {
            return this.key(this.convertHorzItemToInternal(item));
        }
    }
    cacheKey(item) {
        const time = item;
        return time._internal_businessDay === undefined
            ? new Date(time._internal_timestamp * 1000).getTime()
            : new Date(Date.UTC(time._internal_businessDay.year, time._internal_businessDay.month - 1, time._internal_businessDay.day)).getTime();
    }
    convertHorzItemToInternal(item) {
        return convertTime(item);
    }
    updateFormatter(options) {
        if (!this._private__options) {
            return;
        }
        const dateFormat = options.dateFormat;
        if (this._private__options.timeScale.timeVisible) {
            this._private__dateTimeFormatter = new DateTimeFormatter({
                _internal_dateFormat: dateFormat,
                _internal_timeFormat: this._private__options.timeScale.secondsVisible ? '%h:%m:%s' : '%h:%m',
                _internal_dateTimeSeparator: '   ',
                _internal_locale: options.locale,
            });
        }
        else {
            this._private__dateTimeFormatter = new DateFormatter(dateFormat, options.locale);
        }
    }
    formatHorzItem(item) {
        const tp = item;
        return this._private__dateTimeFormatter._internal_format(new Date(tp._internal_timestamp * 1000));
    }
    formatTickmark(tickMark, localizationOptions) {
        const tickMarkType = weightToTickMarkType(tickMark.weight, this._private__options.timeScale.timeVisible, this._private__options.timeScale.secondsVisible);
        const options = this._private__options.timeScale;
        if (options.tickMarkFormatter !== undefined) {
            const tickMarkString = options.tickMarkFormatter(tickMark.originalTime, tickMarkType, localizationOptions.locale);
            if (tickMarkString !== null) {
                return tickMarkString;
            }
        }
        return defaultTickMarkFormatter(tickMark.time, tickMarkType, localizationOptions.locale);
    }
    maxTickMarkWeight(tickMarks) {
        let maxWeight = tickMarks.reduce(markWithGreaterWeight$2, tickMarks[0]).weight;
        // special case: it looks strange if 15:00 is bold but 14:00 is not
        // so if maxWeight > TickMarkWeight.Hour1 and < TickMarkWeight.Day reduce it to TickMarkWeight.Hour1
        if (maxWeight > 30 /* TickMarkWeight.Hour1 */ && maxWeight < 50 /* TickMarkWeight.Day */) {
            maxWeight = 30 /* TickMarkWeight.Hour1 */;
        }
        return maxWeight;
    }
    fillWeightsForPoints(sortedTimePoints, startIndex) {
        fillWeightsForPoints(sortedTimePoints, startIndex);
    }
    static _internal_applyDefaults(options) {
        return merge({ localization: { dateFormat: 'dd MMM \'yy' } }, options ?? {});
    }
}

function size$1(_a) {
    var width = _a.width, height = _a.height;
    if (width < 0) {
        throw new Error('Negative width is not allowed for Size');
    }
    if (height < 0) {
        throw new Error('Negative height is not allowed for Size');
    }
    return {
        width: width,
        height: height,
    };
}
function equalSizes(first, second) {
    return (first.width === second.width) &&
        (first.height === second.height);
}

var Observable = /** @class */ (function () {
    function Observable(win) {
        var _this = this;
        this._resolutionListener = function () { return _this._onResolutionChanged(); };
        this._resolutionMediaQueryList = null;
        this._observers = [];
        this._window = win;
        this._installResolutionListener();
    }
    Observable.prototype.dispose = function () {
        this._uninstallResolutionListener();
        this._window = null;
    };
    Object.defineProperty(Observable.prototype, "value", {
        get: function () {
            return this._window.devicePixelRatio;
        },
        enumerable: false,
        configurable: true
    });
    Observable.prototype.subscribe = function (next) {
        var _this = this;
        var observer = { next: next };
        this._observers.push(observer);
        return {
            unsubscribe: function () {
                _this._observers = _this._observers.filter(function (o) { return o !== observer; });
            },
        };
    };
    Observable.prototype._installResolutionListener = function () {
        if (this._resolutionMediaQueryList !== null) {
            throw new Error('Resolution listener is already installed');
        }
        var dppx = this._window.devicePixelRatio;
        this._resolutionMediaQueryList = this._window.matchMedia("all and (resolution: ".concat(dppx, "dppx)"));
        // IE and some versions of Edge do not support addEventListener/removeEventListener, and we are going to use the deprecated addListener/removeListener
        this._resolutionMediaQueryList.addListener(this._resolutionListener);
    };
    Observable.prototype._uninstallResolutionListener = function () {
        if (this._resolutionMediaQueryList !== null) {
            // IE and some versions of Edge do not support addEventListener/removeEventListener, and we are going to use the deprecated addListener/removeListener
            this._resolutionMediaQueryList.removeListener(this._resolutionListener);
            this._resolutionMediaQueryList = null;
        }
    };
    Observable.prototype._reinstallResolutionListener = function () {
        this._uninstallResolutionListener();
        this._installResolutionListener();
    };
    Observable.prototype._onResolutionChanged = function () {
        var _this = this;
        this._observers.forEach(function (observer) { return observer.next(_this._window.devicePixelRatio); });
        this._reinstallResolutionListener();
    };
    return Observable;
}());
function createObservable(win) {
    return new Observable(win);
}

var DevicePixelContentBoxBinding = /** @class */ (function () {
    function DevicePixelContentBoxBinding(canvasElement, transformBitmapSize, options) {
        var _a;
        this._canvasElement = null;
        this._bitmapSizeChangedListeners = [];
        this._suggestedBitmapSize = null;
        this._suggestedBitmapSizeChangedListeners = [];
        // devicePixelRatio approach
        this._devicePixelRatioObservable = null;
        // ResizeObserver approach
        this._canvasElementResizeObserver = null;
        this._canvasElement = canvasElement;
        this._canvasElementClientSize = size$1({
            width: this._canvasElement.clientWidth,
            height: this._canvasElement.clientHeight,
        });
        this._transformBitmapSize = transformBitmapSize !== null && transformBitmapSize !== void 0 ? transformBitmapSize : (function (size) { return size; });
        this._allowResizeObserver = (_a = options === null || options === void 0 ? void 0 : options.allowResizeObserver) !== null && _a !== void 0 ? _a : true;
        this._chooseAndInitObserver();
        // we MAY leave the constuctor without any bitmap size observation mechanics initialized
    }
    DevicePixelContentBoxBinding.prototype.dispose = function () {
        var _a, _b;
        if (this._canvasElement === null) {
            throw new Error('Object is disposed');
        }
        (_a = this._canvasElementResizeObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
        this._canvasElementResizeObserver = null;
        (_b = this._devicePixelRatioObservable) === null || _b === void 0 ? void 0 : _b.dispose();
        this._devicePixelRatioObservable = null;
        this._suggestedBitmapSizeChangedListeners.length = 0;
        this._bitmapSizeChangedListeners.length = 0;
        this._canvasElement = null;
    };
    Object.defineProperty(DevicePixelContentBoxBinding.prototype, "canvasElement", {
        get: function () {
            if (this._canvasElement === null) {
                throw new Error('Object is disposed');
            }
            return this._canvasElement;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DevicePixelContentBoxBinding.prototype, "canvasElementClientSize", {
        get: function () {
            return this._canvasElementClientSize;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DevicePixelContentBoxBinding.prototype, "bitmapSize", {
        get: function () {
            return size$1({
                width: this.canvasElement.width,
                height: this.canvasElement.height,
            });
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Use this function to change canvas element client size until binding is disposed
     * @param clientSize New client size for bound HTMLCanvasElement
     */
    DevicePixelContentBoxBinding.prototype.resizeCanvasElement = function (clientSize) {
        this._canvasElementClientSize = size$1(clientSize);
        this.canvasElement.style.width = "".concat(this._canvasElementClientSize.width, "px");
        this.canvasElement.style.height = "".concat(this._canvasElementClientSize.height, "px");
        this._invalidateBitmapSize();
    };
    DevicePixelContentBoxBinding.prototype.subscribeBitmapSizeChanged = function (listener) {
        this._bitmapSizeChangedListeners.push(listener);
    };
    DevicePixelContentBoxBinding.prototype.unsubscribeBitmapSizeChanged = function (listener) {
        this._bitmapSizeChangedListeners = this._bitmapSizeChangedListeners.filter(function (l) { return l !== listener; });
    };
    Object.defineProperty(DevicePixelContentBoxBinding.prototype, "suggestedBitmapSize", {
        get: function () {
            return this._suggestedBitmapSize;
        },
        enumerable: false,
        configurable: true
    });
    DevicePixelContentBoxBinding.prototype.subscribeSuggestedBitmapSizeChanged = function (listener) {
        this._suggestedBitmapSizeChangedListeners.push(listener);
    };
    DevicePixelContentBoxBinding.prototype.unsubscribeSuggestedBitmapSizeChanged = function (listener) {
        this._suggestedBitmapSizeChangedListeners = this._suggestedBitmapSizeChangedListeners.filter(function (l) { return l !== listener; });
    };
    DevicePixelContentBoxBinding.prototype.applySuggestedBitmapSize = function () {
        if (this._suggestedBitmapSize === null) {
            // nothing to apply
            return;
        }
        var oldSuggestedSize = this._suggestedBitmapSize;
        this._suggestedBitmapSize = null;
        this._resizeBitmap(oldSuggestedSize);
        this._emitSuggestedBitmapSizeChanged(oldSuggestedSize, this._suggestedBitmapSize);
    };
    DevicePixelContentBoxBinding.prototype._resizeBitmap = function (newSize) {
        var oldSize = this.bitmapSize;
        if (equalSizes(oldSize, newSize)) {
            return;
        }
        this.canvasElement.width = newSize.width;
        this.canvasElement.height = newSize.height;
        this._emitBitmapSizeChanged(oldSize, newSize);
    };
    DevicePixelContentBoxBinding.prototype._emitBitmapSizeChanged = function (oldSize, newSize) {
        var _this = this;
        this._bitmapSizeChangedListeners.forEach(function (listener) { return listener.call(_this, oldSize, newSize); });
    };
    DevicePixelContentBoxBinding.prototype._suggestNewBitmapSize = function (newSize) {
        var oldSuggestedSize = this._suggestedBitmapSize;
        var finalNewSize = size$1(this._transformBitmapSize(newSize, this._canvasElementClientSize));
        var newSuggestedSize = equalSizes(this.bitmapSize, finalNewSize) ? null : finalNewSize;
        if (oldSuggestedSize === null && newSuggestedSize === null) {
            return;
        }
        if (oldSuggestedSize !== null && newSuggestedSize !== null
            && equalSizes(oldSuggestedSize, newSuggestedSize)) {
            return;
        }
        this._suggestedBitmapSize = newSuggestedSize;
        this._emitSuggestedBitmapSizeChanged(oldSuggestedSize, newSuggestedSize);
    };
    DevicePixelContentBoxBinding.prototype._emitSuggestedBitmapSizeChanged = function (oldSize, newSize) {
        var _this = this;
        this._suggestedBitmapSizeChangedListeners.forEach(function (listener) { return listener.call(_this, oldSize, newSize); });
    };
    DevicePixelContentBoxBinding.prototype._chooseAndInitObserver = function () {
        var _this = this;
        if (!this._allowResizeObserver) {
            this._initDevicePixelRatioObservable();
            return;
        }
        isDevicePixelContentBoxSupported()
            .then(function (isSupported) {
            return isSupported ?
                _this._initResizeObserver() :
                _this._initDevicePixelRatioObservable();
        });
    };
    // devicePixelRatio approach
    DevicePixelContentBoxBinding.prototype._initDevicePixelRatioObservable = function () {
        var _this = this;
        if (this._canvasElement === null) {
            // it looks like we are already dead
            return;
        }
        var win = canvasElementWindow(this._canvasElement);
        if (win === null) {
            throw new Error('No window is associated with the canvas');
        }
        this._devicePixelRatioObservable = createObservable(win);
        this._devicePixelRatioObservable.subscribe(function () { return _this._invalidateBitmapSize(); });
        this._invalidateBitmapSize();
    };
    DevicePixelContentBoxBinding.prototype._invalidateBitmapSize = function () {
        var _a, _b;
        if (this._canvasElement === null) {
            // it looks like we are already dead
            return;
        }
        var win = canvasElementWindow(this._canvasElement);
        if (win === null) {
            return;
        }
        var ratio = (_b = (_a = this._devicePixelRatioObservable) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : win.devicePixelRatio;
        var canvasRects = this._canvasElement.getClientRects();
        var newSize = 
        // eslint-disable-next-line no-negated-condition
        canvasRects[0] !== undefined ?
            predictedBitmapSize(canvasRects[0], ratio) :
            size$1({
                width: this._canvasElementClientSize.width * ratio,
                height: this._canvasElementClientSize.height * ratio,
            });
        this._suggestNewBitmapSize(newSize);
    };
    // ResizeObserver approach
    DevicePixelContentBoxBinding.prototype._initResizeObserver = function () {
        var _this = this;
        if (this._canvasElement === null) {
            // it looks like we are already dead
            return;
        }
        this._canvasElementResizeObserver = new ResizeObserver(function (entries) {
            var entry = entries.find(function (entry) { return entry.target === _this._canvasElement; });
            if (!entry || !entry.devicePixelContentBoxSize || !entry.devicePixelContentBoxSize[0]) {
                return;
            }
            var entrySize = entry.devicePixelContentBoxSize[0];
            var newSize = size$1({
                width: entrySize.inlineSize,
                height: entrySize.blockSize,
            });
            _this._suggestNewBitmapSize(newSize);
        });
        this._canvasElementResizeObserver.observe(this._canvasElement, { box: 'device-pixel-content-box' });
    };
    return DevicePixelContentBoxBinding;
}());
function bindTo(canvasElement, target) {
    if (target.type === 'device-pixel-content-box') {
        return new DevicePixelContentBoxBinding(canvasElement, target.transform, target.options);
    }
    throw new Error('Unsupported binding target');
}
function canvasElementWindow(canvasElement) {
    // According to DOM Level 2 Core specification, ownerDocument should never be null for HTMLCanvasElement
    // see https://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#node-ownerDoc
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return canvasElement.ownerDocument.defaultView;
}
function isDevicePixelContentBoxSupported() {
    return new Promise(function (resolve) {
        var ro = new ResizeObserver(function (entries) {
            resolve(entries.every(function (entry) { return 'devicePixelContentBoxSize' in entry; }));
            ro.disconnect();
        });
        ro.observe(document.body, { box: 'device-pixel-content-box' });
    })
        .catch(function () { return false; });
}
function predictedBitmapSize(canvasRect, ratio) {
    return size$1({
        width: Math.round(canvasRect.left * ratio + canvasRect.width * ratio) -
            Math.round(canvasRect.left * ratio),
        height: Math.round(canvasRect.top * ratio + canvasRect.height * ratio) -
            Math.round(canvasRect.top * ratio),
    });
}

/**
 * @experimental
 */
var CanvasRenderingTarget2D = /** @class */ (function () {
    function CanvasRenderingTarget2D(context, mediaSize, bitmapSize) {
        if (mediaSize.width === 0 || mediaSize.height === 0) {
            throw new TypeError('Rendering target could only be created on a media with positive width and height');
        }
        this._mediaSize = mediaSize;
        // !Number.isInteger(bitmapSize.width) || !Number.isInteger(bitmapSize.height)
        if (bitmapSize.width === 0 || bitmapSize.height === 0) {
            throw new TypeError('Rendering target could only be created using a bitmap with positive integer width and height');
        }
        this._bitmapSize = bitmapSize;
        this._context = context;
    }
    CanvasRenderingTarget2D.prototype.useMediaCoordinateSpace = function (f) {
        try {
            this._context.save();
            // do not use resetTransform to support old versions of Edge
            this._context.setTransform(1, 0, 0, 1, 0, 0);
            this._context.scale(this._horizontalPixelRatio, this._verticalPixelRatio);
            return f({
                context: this._context,
                mediaSize: this._mediaSize,
            });
        }
        finally {
            this._context.restore();
        }
    };
    CanvasRenderingTarget2D.prototype.useBitmapCoordinateSpace = function (f) {
        try {
            this._context.save();
            // do not use resetTransform to support old versions of Edge
            this._context.setTransform(1, 0, 0, 1, 0, 0);
            return f({
                context: this._context,
                mediaSize: this._mediaSize,
                bitmapSize: this._bitmapSize,
                horizontalPixelRatio: this._horizontalPixelRatio,
                verticalPixelRatio: this._verticalPixelRatio,
            });
        }
        finally {
            this._context.restore();
        }
    };
    Object.defineProperty(CanvasRenderingTarget2D.prototype, "_horizontalPixelRatio", {
        get: function () {
            return this._bitmapSize.width / this._mediaSize.width;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CanvasRenderingTarget2D.prototype, "_verticalPixelRatio", {
        get: function () {
            return this._bitmapSize.height / this._mediaSize.height;
        },
        enumerable: false,
        configurable: true
    });
    return CanvasRenderingTarget2D;
}());
/**
 * @experimental
 */
function tryCreateCanvasRenderingTarget2D(binding, contextOptions) {
    var mediaSize = binding.canvasElementClientSize;
    if (mediaSize.width === 0 || mediaSize.height === 0) {
        return null;
    }
    var bitmapSize = binding.bitmapSize;
    if (bitmapSize.width === 0 || bitmapSize.height === 0) {
        return null;
    }
    var context = binding.canvasElement.getContext('2d', contextOptions);
    if (context === null) {
        return null;
    }
    return new CanvasRenderingTarget2D(context, mediaSize, bitmapSize);
}

/**
 * When you're trying to use the library in server-side context (for instance in SSR)
 * you don't have some browser-specific variables like navigator or window
 * and if the library will use them on the top level of the library
 * the import will fail due ReferenceError
 * thus, this allows use the navigator on the top level and being imported in server-side context as well
 * See issue #446
 */
// eslint-disable-next-line @typescript-eslint/tslint/config
const isRunningOnClientSide = typeof window !== 'undefined';

function isFF() {
    if (!isRunningOnClientSide) {
        return false;
    }
    return window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}
function isIOS() {
    if (!isRunningOnClientSide) {
        return false;
    }
    // eslint-disable-next-line deprecation/deprecation
    return /iPhone|iPad|iPod/.test(window.navigator.platform);
}
function isChrome() {
    if (!isRunningOnClientSide) {
        return false;
    }
    return window.chrome !== undefined;
}
// Determine whether the browser is running on windows.
function isWindows() {
    if (!isRunningOnClientSide) {
        return false;
    }
    // more accurate if available
    if (navigator?.userAgentData?.platform) {
        return navigator.userAgentData.platform === 'Windows';
    }
    return navigator.userAgent.toLowerCase().indexOf('win') >= 0;
}
// Determine whether the browser is Chromium based.
function isChromiumBased() {
    if (!isRunningOnClientSide) {
        return false;
    }
    if (!navigator.userAgentData) {
        return false;
    }
    return navigator.userAgentData.brands.some((brand) => {
        return brand.brand.includes('Chromium');
    });
}

/// <reference types="_build-time-constants" />
function warn(msg) {
    {
        // eslint-disable-next-line no-console
        console.warn(msg);
    }
}

// on Hi-DPI CSS size * Device Pixel Ratio should be integer to avoid smoothing
// For chart widget we decrease the size because we must be inside container.
// For time axis this is not important, since it just affects space for pane widgets
function suggestChartSize(originalSize) {
    const integerWidth = Math.floor(originalSize.width);
    const integerHeight = Math.floor(originalSize.height);
    const width = integerWidth - (integerWidth % 2);
    const height = integerHeight - (integerHeight % 2);
    return size$1({ width, height });
}
function suggestTimeScaleHeight(originalHeight) {
    return originalHeight + (originalHeight % 2);
}
function suggestPriceScaleWidth(originalWidth) {
    return originalWidth + (originalWidth % 2);
}

function preventScrollByWheelClick(el) {
    if (!isChrome()) {
        return;
    }
    el.addEventListener('mousedown', (e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (e.button === 1 /* MouseEventButton.Middle */) {
            // prevent incorrect scrolling event
            e.preventDefault();
            return false;
        }
        return undefined;
    });
}

// TODO: get rid of a lot of boolean flags, probably we should replace it with some enum
class MouseEventHandler {
    constructor(target, handler, options) {
        this._private__clickCount = 0;
        this._private__clickTimeoutId = null;
        this._private__clickPosition = { _internal_x: Number.NEGATIVE_INFINITY, _internal_y: Number.POSITIVE_INFINITY };
        this._private__tapCount = 0;
        this._private__tapTimeoutId = null;
        this._private__tapPosition = { _internal_x: Number.NEGATIVE_INFINITY, _internal_y: Number.POSITIVE_INFINITY };
        this._private__longTapTimeoutId = null;
        this._private__longTapActive = false;
        this._private__mouseMoveStartPosition = null;
        this._private__touchMoveStartPosition = null;
        this._private__touchMoveExceededManhattanDistance = false;
        this._private__cancelClick = false;
        this._private__cancelTap = false;
        this._private__unsubscribeOutsideMouseEvents = null;
        this._private__unsubscribeOutsideTouchEvents = null;
        this._private__unsubscribeMobileSafariEvents = null;
        this._private__unsubscribeMousemove = null;
        this._private__unsubscribeRootMouseEvents = null;
        this._private__unsubscribeRootTouchEvents = null;
        this._private__startPinchMiddlePoint = null;
        this._private__startPinchDistance = 0;
        this._private__pinchPrevented = false;
        this._private__preventTouchDragProcess = false;
        this._private__mousePressed = false;
        this._private__lastTouchEventTimeStamp = 0;
        // for touchstart/touchmove/touchend events we handle only first touch
        // i.e. we don't support several active touches at the same time (except pinch event)
        this._private__activeTouchId = null;
        // accept all mouse leave events if it's not an iOS device
        // see _mouseEnterHandler, _mouseMoveHandler, _mouseLeaveHandler
        this._private__acceptMouseLeave = !isIOS();
        /**
         * In Firefox mouse events dont't fire if the mouse position is outside of the browser's border.
         * To prevent the mouse from hanging while pressed we're subscribing on the mouseleave event of the document element.
         * We're subscribing on mouseleave, but this event is actually fired on mouseup outside of the browser's border.
         */
        this._private__onFirefoxOutsideMouseUp = (mouseUpEvent) => {
            this._private__mouseUpHandler(mouseUpEvent);
        };
        /**
         * Safari doesn't fire touchstart/mousedown events on double tap since iOS 13.
         * There are two possible solutions:
         * 1) Call preventDefault in touchEnd handler. But it also prevents click event from firing.
         * 2) Add listener on dblclick event that fires with the preceding mousedown/mouseup.
         * https://developer.apple.com/forums/thread/125073
         */
        this._private__onMobileSafariDoubleClick = (dblClickEvent) => {
            if (this._private__firesTouchEvents(dblClickEvent)) {
                const compatEvent = this._private__makeCompatEvent(dblClickEvent);
                ++this._private__tapCount;
                if (this._private__tapTimeoutId && this._private__tapCount > 1) {
                    const { _internal_manhattanDistance: manhattanDistance } = this._private__touchMouseMoveWithDownInfo(getPosition(dblClickEvent), this._private__tapPosition);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                    if (manhattanDistance < 30 /* Constants.DoubleTapManhattanDistance */ && !this._private__cancelTap) {
                        this._private__processTouchEvent(compatEvent, this._private__handler._internal_doubleTapEvent);
                    }
                    this._private__resetTapTimeout();
                }
            }
            else {
                const compatEvent = this._private__makeCompatEvent(dblClickEvent);
                ++this._private__clickCount;
                if (this._private__clickTimeoutId && this._private__clickCount > 1) {
                    const { _internal_manhattanDistance: manhattanDistance } = this._private__touchMouseMoveWithDownInfo(getPosition(dblClickEvent), this._private__clickPosition);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                    if (manhattanDistance < 5 /* Constants.DoubleClickManhattanDistance */ && !this._private__cancelClick) {
                        this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseDoubleClickEvent);
                    }
                    this._private__resetClickTimeout();
                }
            }
        };
        this._private__target = target;
        this._private__handler = handler;
        this._private__options = options;
        this._private__init();
    }
    _internal_destroy() {
        if (this._private__unsubscribeOutsideMouseEvents !== null) {
            this._private__unsubscribeOutsideMouseEvents();
            this._private__unsubscribeOutsideMouseEvents = null;
        }
        if (this._private__unsubscribeOutsideTouchEvents !== null) {
            this._private__unsubscribeOutsideTouchEvents();
            this._private__unsubscribeOutsideTouchEvents = null;
        }
        if (this._private__unsubscribeMousemove !== null) {
            this._private__unsubscribeMousemove();
            this._private__unsubscribeMousemove = null;
        }
        if (this._private__unsubscribeRootMouseEvents !== null) {
            this._private__unsubscribeRootMouseEvents();
            this._private__unsubscribeRootMouseEvents = null;
        }
        if (this._private__unsubscribeRootTouchEvents !== null) {
            this._private__unsubscribeRootTouchEvents();
            this._private__unsubscribeRootTouchEvents = null;
        }
        if (this._private__unsubscribeMobileSafariEvents !== null) {
            this._private__unsubscribeMobileSafariEvents();
            this._private__unsubscribeMobileSafariEvents = null;
        }
        this._private__clearLongTapTimeout();
        this._private__resetClickTimeout();
    }
    _private__mouseEnterHandler(enterEvent) {
        if (this._private__unsubscribeMousemove) {
            this._private__unsubscribeMousemove();
        }
        const boundMouseMoveHandler = this._private__mouseMoveHandler.bind(this);
        this._private__unsubscribeMousemove = () => {
            this._private__target.removeEventListener('mousemove', boundMouseMoveHandler);
        };
        this._private__target.addEventListener('mousemove', boundMouseMoveHandler);
        if (this._private__firesTouchEvents(enterEvent)) {
            return;
        }
        const compatEvent = this._private__makeCompatEvent(enterEvent);
        this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseEnterEvent);
        this._private__acceptMouseLeave = true;
    }
    _private__resetClickTimeout() {
        if (this._private__clickTimeoutId !== null) {
            clearTimeout(this._private__clickTimeoutId);
        }
        this._private__clickCount = 0;
        this._private__clickTimeoutId = null;
        this._private__clickPosition = { _internal_x: Number.NEGATIVE_INFINITY, _internal_y: Number.POSITIVE_INFINITY };
    }
    _private__resetTapTimeout() {
        if (this._private__tapTimeoutId !== null) {
            clearTimeout(this._private__tapTimeoutId);
        }
        this._private__tapCount = 0;
        this._private__tapTimeoutId = null;
        this._private__tapPosition = { _internal_x: Number.NEGATIVE_INFINITY, _internal_y: Number.POSITIVE_INFINITY };
    }
    _private__mouseMoveHandler(moveEvent) {
        if (this._private__mousePressed || this._private__touchMoveStartPosition !== null) {
            return;
        }
        if (this._private__firesTouchEvents(moveEvent)) {
            return;
        }
        const compatEvent = this._private__makeCompatEvent(moveEvent);
        this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseMoveEvent);
        this._private__acceptMouseLeave = true;
    }
    _private__touchMoveHandler(moveEvent) {
        const touch = touchWithId(moveEvent.changedTouches, ensureNotNull(this._private__activeTouchId));
        if (touch === null) {
            return;
        }
        this._private__lastTouchEventTimeStamp = eventTimeStamp(moveEvent);
        if (this._private__startPinchMiddlePoint !== null) {
            return;
        }
        if (this._private__preventTouchDragProcess) {
            return;
        }
        // prevent pinch if move event comes faster than the second touch
        this._private__pinchPrevented = true;
        const moveInfo = this._private__touchMouseMoveWithDownInfo(getPosition(touch), ensureNotNull(this._private__touchMoveStartPosition));
        const { _internal_xOffset: xOffset, _internal_yOffset: yOffset, _internal_manhattanDistance: manhattanDistance } = moveInfo;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (!this._private__touchMoveExceededManhattanDistance && manhattanDistance < 5 /* Constants.CancelTapManhattanDistance */) {
            return;
        }
        if (!this._private__touchMoveExceededManhattanDistance) {
            // first time when current position exceeded manhattan distance
            // vertical drag is more important than horizontal drag
            // because we scroll the page vertically often than horizontally
            const correctedXOffset = xOffset * 0.5;
            // a drag can be only if touch page scroll isn't allowed
            const isVertDrag = yOffset >= correctedXOffset && !this._private__options._internal_treatVertTouchDragAsPageScroll();
            const isHorzDrag = correctedXOffset > yOffset && !this._private__options._internal_treatHorzTouchDragAsPageScroll();
            // if drag event happened then we should revert preventDefault state to original one
            // and try to process the drag event
            // else we shouldn't prevent default of the event and ignore processing the drag event
            if (!isVertDrag && !isHorzDrag) {
                this._private__preventTouchDragProcess = true;
            }
            this._private__touchMoveExceededManhattanDistance = true;
            // if manhattan distance is more that 5 - we should cancel tap event
            this._private__cancelTap = true;
            this._private__clearLongTapTimeout();
            this._private__resetTapTimeout();
        }
        if (!this._private__preventTouchDragProcess) {
            const compatEvent = this._private__makeCompatEvent(moveEvent, touch);
            this._private__processTouchEvent(compatEvent, this._private__handler._internal_touchMoveEvent);
            // we should prevent default in case of touch only
            // to prevent scroll of the page
            preventDefault(moveEvent);
        }
    }
    _private__mouseMoveWithDownHandler(moveEvent) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (moveEvent.button !== 0 /* MouseEventButton.Left */) {
            return;
        }
        const moveInfo = this._private__touchMouseMoveWithDownInfo(getPosition(moveEvent), ensureNotNull(this._private__mouseMoveStartPosition));
        const { _internal_manhattanDistance: manhattanDistance } = moveInfo;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (manhattanDistance >= 5 /* Constants.CancelClickManhattanDistance */) {
            // if manhattan distance is more that 5 - we should cancel click event
            this._private__cancelClick = true;
            this._private__resetClickTimeout();
        }
        if (this._private__cancelClick) {
            // if this._cancelClick is true, that means that minimum manhattan distance is already exceeded
            const compatEvent = this._private__makeCompatEvent(moveEvent);
            this._private__processMouseEvent(compatEvent, this._private__handler._internal_pressedMouseMoveEvent);
        }
    }
    _private__touchMouseMoveWithDownInfo(currentPosition, startPosition) {
        const xOffset = Math.abs(startPosition._internal_x - currentPosition._internal_x);
        const yOffset = Math.abs(startPosition._internal_y - currentPosition._internal_y);
        const manhattanDistance = xOffset + yOffset;
        return {
            _internal_xOffset: xOffset,
            _internal_yOffset: yOffset,
            _internal_manhattanDistance: manhattanDistance,
        };
    }
    // eslint-disable-next-line complexity
    _private__touchEndHandler(touchEndEvent) {
        let touch = touchWithId(touchEndEvent.changedTouches, ensureNotNull(this._private__activeTouchId));
        if (touch === null && touchEndEvent.touches.length === 0) {
            // something went wrong, somehow we missed the required touchend event
            // probably the browser has not sent this event
            touch = touchEndEvent.changedTouches[0];
        }
        if (touch === null) {
            return;
        }
        this._private__activeTouchId = null;
        this._private__lastTouchEventTimeStamp = eventTimeStamp(touchEndEvent);
        this._private__clearLongTapTimeout();
        this._private__touchMoveStartPosition = null;
        if (this._private__unsubscribeRootTouchEvents) {
            this._private__unsubscribeRootTouchEvents();
            this._private__unsubscribeRootTouchEvents = null;
        }
        const compatEvent = this._private__makeCompatEvent(touchEndEvent, touch);
        this._private__processTouchEvent(compatEvent, this._private__handler._internal_touchEndEvent);
        ++this._private__tapCount;
        if (this._private__tapTimeoutId && this._private__tapCount > 1) {
            // check that both clicks are near enough
            const { _internal_manhattanDistance: manhattanDistance } = this._private__touchMouseMoveWithDownInfo(getPosition(touch), this._private__tapPosition);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            if (manhattanDistance < 30 /* Constants.DoubleTapManhattanDistance */ && !this._private__cancelTap) {
                this._private__processTouchEvent(compatEvent, this._private__handler._internal_doubleTapEvent);
            }
            this._private__resetTapTimeout();
        }
        else {
            if (!this._private__cancelTap) {
                this._private__processTouchEvent(compatEvent, this._private__handler._internal_tapEvent);
                // do not fire mouse events if tap handler was executed
                // prevent click event on new dom element (who appeared after tap)
                if (this._private__handler._internal_tapEvent) {
                    preventDefault(touchEndEvent);
                }
            }
        }
        // prevent, for example, safari's dblclick-to-zoom or fast-click after long-tap
        // we handle mouseDoubleClickEvent here ourselves
        if (this._private__tapCount === 0) {
            preventDefault(touchEndEvent);
        }
        if (touchEndEvent.touches.length === 0) {
            if (this._private__longTapActive) {
                this._private__longTapActive = false;
                // prevent native click event
                preventDefault(touchEndEvent);
            }
        }
    }
    _private__mouseUpHandler(mouseUpEvent) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (mouseUpEvent.button !== 0 /* MouseEventButton.Left */) {
            return;
        }
        const compatEvent = this._private__makeCompatEvent(mouseUpEvent);
        this._private__mouseMoveStartPosition = null;
        this._private__mousePressed = false;
        if (this._private__unsubscribeRootMouseEvents) {
            this._private__unsubscribeRootMouseEvents();
            this._private__unsubscribeRootMouseEvents = null;
        }
        if (isFF()) {
            const rootElement = this._private__target.ownerDocument.documentElement;
            rootElement.removeEventListener('mouseleave', this._private__onFirefoxOutsideMouseUp);
        }
        if (this._private__firesTouchEvents(mouseUpEvent)) {
            return;
        }
        this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseUpEvent);
        ++this._private__clickCount;
        if (this._private__clickTimeoutId && this._private__clickCount > 1) {
            // check that both clicks are near enough
            const { _internal_manhattanDistance: manhattanDistance } = this._private__touchMouseMoveWithDownInfo(getPosition(mouseUpEvent), this._private__clickPosition);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
            if (manhattanDistance < 5 /* Constants.DoubleClickManhattanDistance */ && !this._private__cancelClick) {
                this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseDoubleClickEvent);
            }
            this._private__resetClickTimeout();
        }
        else {
            if (!this._private__cancelClick) {
                this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseClickEvent);
            }
        }
    }
    _private__clearLongTapTimeout() {
        if (this._private__longTapTimeoutId === null) {
            return;
        }
        clearTimeout(this._private__longTapTimeoutId);
        this._private__longTapTimeoutId = null;
    }
    _private__touchStartHandler(downEvent) {
        if (this._private__activeTouchId !== null) {
            return;
        }
        const touch = downEvent.changedTouches[0];
        this._private__activeTouchId = touch.identifier;
        this._private__lastTouchEventTimeStamp = eventTimeStamp(downEvent);
        const rootElement = this._private__target.ownerDocument.documentElement;
        this._private__cancelTap = false;
        this._private__touchMoveExceededManhattanDistance = false;
        this._private__preventTouchDragProcess = false;
        this._private__touchMoveStartPosition = getPosition(touch);
        if (this._private__unsubscribeRootTouchEvents) {
            this._private__unsubscribeRootTouchEvents();
            this._private__unsubscribeRootTouchEvents = null;
        }
        {
            const boundTouchMoveWithDownHandler = this._private__touchMoveHandler.bind(this);
            const boundTouchEndHandler = this._private__touchEndHandler.bind(this);
            this._private__unsubscribeRootTouchEvents = () => {
                rootElement.removeEventListener('touchmove', boundTouchMoveWithDownHandler);
                rootElement.removeEventListener('touchend', boundTouchEndHandler);
            };
            rootElement.addEventListener('touchmove', boundTouchMoveWithDownHandler, { passive: false });
            rootElement.addEventListener('touchend', boundTouchEndHandler, { passive: false });
            this._private__clearLongTapTimeout();
            this._private__longTapTimeoutId = setTimeout(this._private__longTapHandler.bind(this, downEvent), 240 /* Delay.LongTap */);
        }
        const compatEvent = this._private__makeCompatEvent(downEvent, touch);
        this._private__processTouchEvent(compatEvent, this._private__handler._internal_touchStartEvent);
        if (!this._private__tapTimeoutId) {
            this._private__tapCount = 0;
            this._private__tapTimeoutId = setTimeout(this._private__resetTapTimeout.bind(this), 500 /* Delay.ResetClick */);
            this._private__tapPosition = getPosition(touch);
        }
    }
    _private__mouseDownHandler(downEvent) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (downEvent.button !== 0 /* MouseEventButton.Left */) {
            return;
        }
        const rootElement = this._private__target.ownerDocument.documentElement;
        if (isFF()) {
            rootElement.addEventListener('mouseleave', this._private__onFirefoxOutsideMouseUp);
        }
        this._private__cancelClick = false;
        this._private__mouseMoveStartPosition = getPosition(downEvent);
        if (this._private__unsubscribeRootMouseEvents) {
            this._private__unsubscribeRootMouseEvents();
            this._private__unsubscribeRootMouseEvents = null;
        }
        {
            const boundMouseMoveWithDownHandler = this._private__mouseMoveWithDownHandler.bind(this);
            const boundMouseUpHandler = this._private__mouseUpHandler.bind(this);
            this._private__unsubscribeRootMouseEvents = () => {
                rootElement.removeEventListener('mousemove', boundMouseMoveWithDownHandler);
                rootElement.removeEventListener('mouseup', boundMouseUpHandler);
            };
            rootElement.addEventListener('mousemove', boundMouseMoveWithDownHandler);
            rootElement.addEventListener('mouseup', boundMouseUpHandler);
        }
        this._private__mousePressed = true;
        if (this._private__firesTouchEvents(downEvent)) {
            return;
        }
        const compatEvent = this._private__makeCompatEvent(downEvent);
        this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseDownEvent);
        if (!this._private__clickTimeoutId) {
            this._private__clickCount = 0;
            this._private__clickTimeoutId = setTimeout(this._private__resetClickTimeout.bind(this), 500 /* Delay.ResetClick */);
            this._private__clickPosition = getPosition(downEvent);
        }
    }
    _private__init() {
        this._private__target.addEventListener('mouseenter', this._private__mouseEnterHandler.bind(this));
        // Do not show context menu when something went wrong
        this._private__target.addEventListener('touchcancel', this._private__clearLongTapTimeout.bind(this));
        {
            const doc = this._private__target.ownerDocument;
            const outsideHandler = (event) => {
                if (!this._private__handler._internal_mouseDownOutsideEvent) {
                    return;
                }
                if (event.composed && this._private__target.contains(event.composedPath()[0])) {
                    return;
                }
                if (event.target && this._private__target.contains(event.target)) {
                    return;
                }
                this._private__handler._internal_mouseDownOutsideEvent();
            };
            this._private__unsubscribeOutsideTouchEvents = () => {
                doc.removeEventListener('touchstart', outsideHandler);
            };
            this._private__unsubscribeOutsideMouseEvents = () => {
                doc.removeEventListener('mousedown', outsideHandler);
            };
            doc.addEventListener('mousedown', outsideHandler);
            doc.addEventListener('touchstart', outsideHandler, { passive: true });
        }
        if (isIOS()) {
            this._private__unsubscribeMobileSafariEvents = () => {
                this._private__target.removeEventListener('dblclick', this._private__onMobileSafariDoubleClick);
            };
            this._private__target.addEventListener('dblclick', this._private__onMobileSafariDoubleClick);
        }
        this._private__target.addEventListener('mouseleave', this._private__mouseLeaveHandler.bind(this));
        this._private__target.addEventListener('touchstart', this._private__touchStartHandler.bind(this), { passive: true });
        preventScrollByWheelClick(this._private__target);
        this._private__target.addEventListener('mousedown', this._private__mouseDownHandler.bind(this));
        this._private__initPinch();
        // Hey mobile Safari, what's up?
        // If mobile Safari doesn't have any touchmove handler with passive=false
        // it treats a touchstart and the following touchmove events as cancelable=false,
        // so we can't prevent them (as soon we subscribe on touchmove inside touchstart's handler).
        // And we'll get scroll of the page along with chart's one instead of only chart's scroll.
        this._private__target.addEventListener('touchmove', () => { }, { passive: false });
    }
    _private__initPinch() {
        if (this._private__handler._internal_pinchStartEvent === undefined &&
            this._private__handler._internal_pinchEvent === undefined &&
            this._private__handler._internal_pinchEndEvent === undefined) {
            return;
        }
        this._private__target.addEventListener('touchstart', (event) => this._private__checkPinchState(event.touches), { passive: true });
        this._private__target.addEventListener('touchmove', (event) => {
            if (event.touches.length !== 2 || this._private__startPinchMiddlePoint === null) {
                return;
            }
            if (this._private__handler._internal_pinchEvent !== undefined) {
                const currentDistance = getDistance(event.touches[0], event.touches[1]);
                const scale = currentDistance / this._private__startPinchDistance;
                this._private__handler._internal_pinchEvent(this._private__startPinchMiddlePoint, scale);
                preventDefault(event);
            }
        }, { passive: false });
        this._private__target.addEventListener('touchend', (event) => {
            this._private__checkPinchState(event.touches);
        });
    }
    _private__checkPinchState(touches) {
        if (touches.length === 1) {
            this._private__pinchPrevented = false;
        }
        if (touches.length !== 2 || this._private__pinchPrevented || this._private__longTapActive) {
            this._private__stopPinch();
        }
        else {
            this._private__startPinch(touches);
        }
    }
    _private__startPinch(touches) {
        const box = getBoundingClientRect(this._private__target);
        this._private__startPinchMiddlePoint = {
            _internal_x: ((touches[0].clientX - box.left) + (touches[1].clientX - box.left)) / 2,
            _internal_y: ((touches[0].clientY - box.top) + (touches[1].clientY - box.top)) / 2,
        };
        this._private__startPinchDistance = getDistance(touches[0], touches[1]);
        if (this._private__handler._internal_pinchStartEvent !== undefined) {
            this._private__handler._internal_pinchStartEvent();
        }
        this._private__clearLongTapTimeout();
    }
    _private__stopPinch() {
        if (this._private__startPinchMiddlePoint === null) {
            return;
        }
        this._private__startPinchMiddlePoint = null;
        if (this._private__handler._internal_pinchEndEvent !== undefined) {
            this._private__handler._internal_pinchEndEvent();
        }
    }
    _private__mouseLeaveHandler(event) {
        if (this._private__unsubscribeMousemove) {
            this._private__unsubscribeMousemove();
        }
        if (this._private__firesTouchEvents(event)) {
            return;
        }
        if (!this._private__acceptMouseLeave) {
            // mobile Safari sometimes emits mouse leave event for no reason, there is no way to handle it in other way
            // just ignore this event if there was no mouse move or mouse enter events
            return;
        }
        const compatEvent = this._private__makeCompatEvent(event);
        this._private__processMouseEvent(compatEvent, this._private__handler._internal_mouseLeaveEvent);
        // accept all mouse leave events if it's not an iOS device
        this._private__acceptMouseLeave = !isIOS();
    }
    _private__longTapHandler(event) {
        const touch = touchWithId(event.touches, ensureNotNull(this._private__activeTouchId));
        if (touch === null) {
            return;
        }
        const compatEvent = this._private__makeCompatEvent(event, touch);
        this._private__processTouchEvent(compatEvent, this._private__handler._internal_longTapEvent);
        this._private__cancelTap = true;
        // long tap is active until touchend event with 0 touches occurred
        this._private__longTapActive = true;
    }
    _private__firesTouchEvents(e) {
        if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents !== undefined) {
            return e.sourceCapabilities.firesTouchEvents;
        }
        return eventTimeStamp(e) < this._private__lastTouchEventTimeStamp + 500 /* Delay.PreventFiresTouchEvents */;
    }
    _private__processTouchEvent(event, callback) {
        if (callback) {
            callback.call(this._private__handler, event);
        }
    }
    _private__processMouseEvent(event, callback) {
        if (!callback) {
            return;
        }
        callback.call(this._private__handler, event);
    }
    _private__makeCompatEvent(event, touch) {
        // TouchEvent has no clientX/Y coordinates:
        // We have to use the last Touch instead
        const eventLike = touch || event;
        const box = this._private__target.getBoundingClientRect() || { left: 0, top: 0 };
        return {
            clientX: eventLike.clientX,
            clientY: eventLike.clientY,
            pageX: eventLike.pageX,
            pageY: eventLike.pageY,
            screenX: eventLike.screenX,
            screenY: eventLike.screenY,
            localX: (eventLike.clientX - box.left),
            localY: (eventLike.clientY - box.top),
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            _internal_isTouch: !event.type.startsWith('mouse') && event.type !== 'contextmenu' && event.type !== 'click',
            _internal_srcType: event.type,
            _internal_target: eventLike.target,
            _internal_view: event.view,
            _internal_preventDefault: () => {
                if (event.type !== 'touchstart') {
                    // touchstart is passive and cannot be prevented
                    preventDefault(event);
                }
            },
        };
    }
}
function getBoundingClientRect(element) {
    return element.getBoundingClientRect() || { left: 0, top: 0 };
}
function getDistance(p1, p2) {
    const xDiff = p1.clientX - p2.clientX;
    const yDiff = p1.clientY - p2.clientY;
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}
function preventDefault(event) {
    if (event.cancelable) {
        event.preventDefault();
    }
}
function getPosition(eventLike) {
    return {
        _internal_x: eventLike.pageX,
        _internal_y: eventLike.pageY,
    };
}
function eventTimeStamp(e) {
    // for some reason e.timestamp is always 0 on iPad with magic mouse, so we use performance.now() as a fallback
    return e.timeStamp || performance.now();
}
function touchWithId(touches, id) {
    for (let i = 0; i < touches.length; ++i) {
        if (touches[i].identifier === id) {
            return touches[i];
        }
    }
    return null;
}

class PaneSeparator {
    constructor(chartWidget, topPaneIndex, bottomPaneIndex) {
        this._private__handle = null;
        this._private__mouseEventHandler = null;
        this._private__resizeEnabled = true;
        this._private__resizeInfo = null;
        this._private__chartWidget = chartWidget;
        this._private__topPane = chartWidget._internal_paneWidgets()[topPaneIndex];
        this._private__bottomPane = chartWidget._internal_paneWidgets()[bottomPaneIndex];
        this._private__rowElement = document.createElement('tr');
        this._private__rowElement.style.height = 1 /* SeparatorConstants.SeparatorHeight */ + 'px';
        this._private__cell = document.createElement('td');
        this._private__cell.style.position = 'relative';
        this._private__cell.style.padding = '0';
        this._private__cell.style.margin = '0';
        this._private__cell.setAttribute('colspan', '3');
        this._private__updateBorderColor();
        this._private__rowElement.appendChild(this._private__cell);
        this._private__resizeEnabled = this._private__chartWidget._internal_options()['layout'].panes.enableResize;
        if (!this._private__resizeEnabled) {
            this._private__handle = null;
            this._private__mouseEventHandler = null;
        }
        else {
            this._private__addResizableHandle();
        }
    }
    _internal_destroy() {
        if (this._private__mouseEventHandler !== null) {
            this._private__mouseEventHandler._internal_destroy();
        }
    }
    _internal_getElement() {
        return this._private__rowElement;
    }
    _internal_getSize() {
        return size$1({
            width: this._private__topPane._internal_getSize().width,
            height: 1 /* SeparatorConstants.SeparatorHeight */,
        });
    }
    _internal_getBitmapSize() {
        return size$1({
            width: this._private__topPane._internal_getBitmapSize().width,
            height: 1 /* SeparatorConstants.SeparatorHeight */ * window.devicePixelRatio,
        });
    }
    _internal_drawBitmap(ctx, x, y) {
        const bitmapSize = this._internal_getBitmapSize();
        ctx.fillStyle = this._private__chartWidget._internal_options()['layout'].panes.separatorColor;
        ctx.fillRect(x, y, bitmapSize.width, bitmapSize.height);
    }
    _internal_update() {
        this._private__updateBorderColor();
        if (this._private__chartWidget._internal_options()['layout'].panes.enableResize !== this._private__resizeEnabled) {
            this._private__resizeEnabled = this._private__chartWidget._internal_options()['layout'].panes.enableResize;
            if (this._private__resizeEnabled) {
                this._private__addResizableHandle();
            }
            else {
                if (this._private__handle !== null) {
                    this._private__cell.removeChild(this._private__handle._internal_backgroundElement);
                    this._private__cell.removeChild(this._private__handle._internal_element);
                    this._private__handle = null;
                }
                if (this._private__mouseEventHandler !== null) {
                    this._private__mouseEventHandler._internal_destroy();
                    this._private__mouseEventHandler = null;
                }
            }
        }
    }
    _private__addResizableHandle() {
        const backgroundElement = document.createElement('div');
        const bgStyle = backgroundElement.style;
        bgStyle.position = 'fixed';
        bgStyle.display = 'none';
        bgStyle.zIndex = '49';
        bgStyle.top = '0';
        bgStyle.left = '0';
        bgStyle.width = '100%';
        bgStyle.height = '100%';
        bgStyle.cursor = 'row-resize';
        this._private__cell.appendChild(backgroundElement);
        const element = document.createElement('div');
        const style = element.style;
        style.position = 'absolute';
        style.zIndex = '50';
        style.top = '-4px';
        style.height = '9px';
        style.width = '100%';
        style.backgroundColor = '';
        style.cursor = 'row-resize';
        this._private__cell.appendChild(element);
        const handlers = {
            _internal_mouseEnterEvent: this._private__mouseOverEvent.bind(this),
            _internal_mouseLeaveEvent: this._private__mouseLeaveEvent.bind(this),
            _internal_mouseDownEvent: this._private__mouseDownEvent.bind(this),
            _internal_touchStartEvent: this._private__mouseDownEvent.bind(this),
            _internal_pressedMouseMoveEvent: this._private__pressedMouseMoveEvent.bind(this),
            _internal_touchMoveEvent: this._private__pressedMouseMoveEvent.bind(this),
            _internal_mouseUpEvent: this._private__mouseUpEvent.bind(this),
            _internal_touchEndEvent: this._private__mouseUpEvent.bind(this),
        };
        this._private__mouseEventHandler = new MouseEventHandler(element, handlers, {
            _internal_treatVertTouchDragAsPageScroll: () => false,
            _internal_treatHorzTouchDragAsPageScroll: () => true,
        });
        this._private__handle = { _internal_element: element, _internal_backgroundElement: backgroundElement };
    }
    _private__updateBorderColor() {
        this._private__cell.style.background = this._private__chartWidget._internal_options()['layout'].panes.separatorColor;
    }
    _private__mouseOverEvent(event) {
        if (this._private__handle !== null) {
            this._private__handle._internal_element.style.backgroundColor = this._private__chartWidget._internal_options()['layout'].panes.separatorHoverColor;
        }
    }
    _private__mouseLeaveEvent(event) {
        if (this._private__handle !== null && this._private__resizeInfo === null) {
            this._private__handle._internal_element.style.backgroundColor = '';
        }
    }
    _private__mouseDownEvent(event) {
        if (this._private__handle === null) {
            return;
        }
        const totalStretch = this._private__topPane._internal_state()._internal_stretchFactor() + this._private__bottomPane._internal_state()._internal_stretchFactor();
        const totalHeight = this._private__topPane._internal_getSize().height + this._private__bottomPane._internal_getSize().height;
        const pixelStretchFactor = totalStretch / totalHeight;
        const minPaneStretch = 30 /* SeparatorConstants.MinPaneHeight */ * pixelStretchFactor;
        if (totalStretch <= minPaneStretch * 2) {
            // cannot resize panes that already have less than minimal height
            // that's possible if there are many panes on the chart
            return;
        }
        this._private__resizeInfo = {
            _internal_startY: event.pageY,
            _internal_prevStretchTopPane: this._private__topPane._internal_state()._internal_stretchFactor(),
            _internal_maxPaneStretch: totalStretch - minPaneStretch,
            _internal_totalStretch: totalStretch,
            _internal_pixelStretchFactor: pixelStretchFactor,
            _internal_minPaneStretch: minPaneStretch,
        };
        this._private__handle._internal_backgroundElement.style.display = 'block';
    }
    _private__pressedMouseMoveEvent(event) {
        const resizeInfo = this._private__resizeInfo;
        if (resizeInfo === null) {
            return;
        }
        const deltaY = event.pageY - resizeInfo._internal_startY;
        const deltaStretchFactor = deltaY * resizeInfo._internal_pixelStretchFactor;
        const upperPaneNewStretch = clamp(resizeInfo._internal_prevStretchTopPane + deltaStretchFactor, resizeInfo._internal_minPaneStretch, resizeInfo._internal_maxPaneStretch);
        this._private__topPane._internal_state()._internal_setStretchFactor(upperPaneNewStretch);
        this._private__bottomPane._internal_state()._internal_setStretchFactor(resizeInfo._internal_totalStretch - upperPaneNewStretch);
        this._private__chartWidget._internal_model()._internal_fullUpdate();
    }
    _private__mouseUpEvent(event) {
        if (this._private__resizeInfo === null || this._private__handle === null) {
            return;
        }
        this._private__resizeInfo = null;
        this._private__handle._internal_backgroundElement.style.display = 'none';
    }
}

function distanceBetweenPoints(pos1, pos2) {
    return pos1._internal_position - pos2._internal_position;
}
function speedPxPerMSec(pos1, pos2, maxSpeed) {
    const speed = (pos1._internal_position - pos2._internal_position) / (pos1._internal_time - pos2._internal_time);
    return Math.sign(speed) * Math.min(Math.abs(speed), maxSpeed);
}
function durationMSec(speed, dumpingCoeff) {
    const lnDumpingCoeff = Math.log(dumpingCoeff);
    return Math.log((1 /* Constants.EpsilonDistance */ * lnDumpingCoeff) / -speed) / (lnDumpingCoeff);
}
class KineticAnimation {
    constructor(minSpeed, maxSpeed, dumpingCoeff, minMove) {
        this._private__position1 = null;
        this._private__position2 = null;
        this._private__position3 = null;
        this._private__position4 = null;
        this._private__animationStartPosition = null;
        this._private__durationMsecs = 0;
        this._private__speedPxPerMsec = 0;
        this._private__minSpeed = minSpeed;
        this._private__maxSpeed = maxSpeed;
        this._private__dumpingCoeff = dumpingCoeff;
        this._private__minMove = minMove;
    }
    _internal_addPosition(position, time) {
        if (this._private__position1 !== null) {
            if (this._private__position1._internal_time === time) {
                this._private__position1._internal_position = position;
                return;
            }
            if (Math.abs(this._private__position1._internal_position - position) < this._private__minMove) {
                return;
            }
        }
        this._private__position4 = this._private__position3;
        this._private__position3 = this._private__position2;
        this._private__position2 = this._private__position1;
        this._private__position1 = { _internal_time: time, _internal_position: position };
    }
    _internal_start(position, time) {
        if (this._private__position1 === null || this._private__position2 === null) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (time - this._private__position1._internal_time > 50 /* Constants.MaxStartDelay */) {
            return;
        }
        // To calculate all the rest parameters we should calculate the speed af first
        let totalDistance = 0;
        const speed1 = speedPxPerMSec(this._private__position1, this._private__position2, this._private__maxSpeed);
        const distance1 = distanceBetweenPoints(this._private__position1, this._private__position2);
        // We're calculating weighted average speed
        // Than more distance for a segment, than more its weight
        const speedItems = [speed1];
        const distanceItems = [distance1];
        totalDistance += distance1;
        if (this._private__position3 !== null) {
            const speed2 = speedPxPerMSec(this._private__position2, this._private__position3, this._private__maxSpeed);
            // stop at this moment if direction of the segment is opposite
            if (Math.sign(speed2) === Math.sign(speed1)) {
                const distance2 = distanceBetweenPoints(this._private__position2, this._private__position3);
                speedItems.push(speed2);
                distanceItems.push(distance2);
                totalDistance += distance2;
                if (this._private__position4 !== null) {
                    const speed3 = speedPxPerMSec(this._private__position3, this._private__position4, this._private__maxSpeed);
                    if (Math.sign(speed3) === Math.sign(speed1)) {
                        const distance3 = distanceBetweenPoints(this._private__position3, this._private__position4);
                        speedItems.push(speed3);
                        distanceItems.push(distance3);
                        totalDistance += distance3;
                    }
                }
            }
        }
        let resultSpeed = 0;
        for (let i = 0; i < speedItems.length; ++i) {
            resultSpeed += distanceItems[i] / totalDistance * speedItems[i];
        }
        if (Math.abs(resultSpeed) < this._private__minSpeed) {
            return;
        }
        this._private__animationStartPosition = { _internal_position: position, _internal_time: time };
        this._private__speedPxPerMsec = resultSpeed;
        this._private__durationMsecs = durationMSec(Math.abs(resultSpeed), this._private__dumpingCoeff);
    }
    _internal_getPosition(time) {
        const startPosition = ensureNotNull(this._private__animationStartPosition);
        const durationMsecs = time - startPosition._internal_time;
        return startPosition._internal_position + this._private__speedPxPerMsec * (Math.pow(this._private__dumpingCoeff, durationMsecs) - 1) / (Math.log(this._private__dumpingCoeff));
    }
    _internal_finished(time) {
        return this._private__animationStartPosition === null || this._private__progressDuration(time) === this._private__durationMsecs;
    }
    _private__progressDuration(time) {
        const startPosition = ensureNotNull(this._private__animationStartPosition);
        const progress = time - startPosition._internal_time;
        return Math.min(progress, this._private__durationMsecs);
    }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="35" height="19" fill="none"><g fill-rule="evenodd" clip-path="url(#a)" clip-rule="evenodd"><path fill="var(--stroke)" d="M2 0H0v10h6v9h21.4l.5-1.3 6-15 1-2.7H23.7l-.5 1.3-.2.6a5 5 0 0 0-7-.9V0H2Zm20 17h4l5.2-13 .8-2h-7l-1 2.5-.2.5-1.5 3.8-.3.7V17Zm-.8-10a3 3 0 0 0 .7-2.7A3 3 0 1 0 16.8 7h4.4ZM14 7V2H2v6h6v9h4V7h2Z"/><path fill="var(--fill)" d="M14 2H2v6h6v9h6V2Zm12 15h-7l6-15h7l-6 15Zm-7-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></g><defs><clipPath id="a"><path fill="var(--stroke)" d="M0 0h35v19H0z"/></clipPath></defs></svg>`;
const css = `a#tv-attr-logo{--fill:#131722;--stroke:#fff;position:absolute;left:10px;bottom:10px;height:19px;width:35px;margin:0;padding:0;border:0;z-index:3;}a#tv-attr-logo[data-dark]{--fill:#D1D4DC;--stroke:#131722;}`;
// This widget doesn't support dynamically responding to options changes
// because it is expected that the `attributionLogo` option won't be changed
// and this saves some bundle size.
class AttributionLogoWidget {
    constructor(container, chart) {
        this._private__element = undefined;
        this._private__cssElement = undefined;
        this._private__theme = undefined;
        this._private__visible = false;
        this._private__container = container;
        this._private__chart = chart;
        this._private__render();
    }
    _internal_update() {
        this._private__render();
    }
    _internal_removeElement() {
        if (this._private__element) {
            this._private__container.removeChild(this._private__element);
        }
        if (this._private__cssElement) {
            this._private__container.removeChild(this._private__cssElement);
        }
        this._private__element = undefined;
        this._private__cssElement = undefined;
    }
    _private__shouldUpdate() {
        return this._private__visible !== this._private__shouldBeVisible() || this._private__theme !== this._private__themeToUse();
    }
    _private__themeToUse() {
        return this._private__chart._internal_model()._internal_colorParser()._internal_colorStringToGrayscale(this._private__chart._internal_options()['layout'].textColor) > 160
            ? 'dark'
            : 'light';
    }
    _private__shouldBeVisible() {
        return this._private__chart._internal_options()['layout'].attributionLogo;
    }
    _private__getUTMSource() {
        const url = new URL(location.href);
        if (!url.hostname) {
            // ignore local testing
            return '';
        }
        return '&utm_source=' + url.hostname + url.pathname;
    }
    _private__render() {
        if (!this._private__shouldUpdate()) {
            return;
        }
        this._internal_removeElement();
        this._private__visible = this._private__shouldBeVisible();
        if (this._private__visible) {
            this._private__theme = this._private__themeToUse();
            this._private__cssElement = document.createElement('style');
            this._private__cssElement.innerText = css;
            this._private__element = document.createElement('a');
            this._private__element.href = `https://www.tradingview.com/?utm_medium=lwc-link&utm_campaign=lwc-chart${this._private__getUTMSource()}`;
            this._private__element.title = 'Charting by TradingView';
            this._private__element.id = 'tv-attr-logo';
            this._private__element.target = '_blank';
            this._private__element.innerHTML = svg;
            this._private__element.toggleAttribute('data-dark', this._private__theme === 'dark');
            this._private__container.appendChild(this._private__cssElement);
            this._private__container.appendChild(this._private__element);
        }
    }
}

function createBoundCanvas(parentElement, size) {
    const doc = ensureNotNull(parentElement.ownerDocument);
    const canvas = doc.createElement('canvas');
    parentElement.appendChild(canvas);
    const binding = bindTo(canvas, {
        type: 'device-pixel-content-box',
        options: {
            allowResizeObserver: true,
        },
        transform: (bitmapSize, canvasElementClientSize) => ({
            width: Math.max(bitmapSize.width, canvasElementClientSize.width),
            height: Math.max(bitmapSize.height, canvasElementClientSize.height),
        }),
    });
    binding.resizeCanvasElement(size);
    return binding;
}
function releaseCanvas(canvas) {
    // This function fixes the iOS Safari error "Total canvas memory use exceeds the maximum limit".
    // Seems that iOS Safari stores canvas elements for some additional time internally.
    // So if we create/destroy a lot of canvas elements in a short period of time we can get this error.
    // We resize the canvas to 1x1 pixels to force it to release memmory resources.
    canvas.width = 1;
    canvas.height = 1;
    canvas.getContext('2d')?.clearRect(0, 0, 1, 1);
}

function drawBackground(renderer, target, isHovered, hitTestData) {
    if (renderer._internal_drawBackground) {
        renderer._internal_drawBackground(target, isHovered, hitTestData);
    }
}
function drawForeground(renderer, target, isHovered, hitTestData) {
    renderer._internal_draw(target, isHovered, hitTestData);
}
function drawSourceViews(paneViewsGetter, drawRendererFn, source, pane) {
    const views = paneViewsGetter(source, pane);
    for (const view of views) {
        const renderer = view._internal_renderer(pane);
        if (renderer !== null) {
            drawRendererFn(renderer);
        }
    }
}

function hasPriceScale(source) {
    return source._internal_priceScale !== undefined;
}
function buildPriceAxisViewsGetter(zOrder, priceScaleId) {
    return (source) => {
        if (!hasPriceScale(source)) {
            return [];
        }
        const psId = source._internal_priceScale()?._internal_id() ?? '';
        if (psId !== priceScaleId) {
            // exclude if source is using a different price scale.
            return [];
        }
        return source._internal_pricePaneViews?.(zOrder) ?? [];
    };
}
function recalculateOverlapping(views, direction, scaleHeight, rendererOptions) {
    if (!views.length) {
        return;
    }
    let currentGroupStart = 0;
    const initLabelHeight = views[0]._internal_height(rendererOptions, true);
    let spaceBeforeCurrentGroup = direction === 1
        ? scaleHeight / 2 - (views[0]._internal_getFixedCoordinate() - initLabelHeight / 2)
        : views[0]._internal_getFixedCoordinate() - initLabelHeight / 2 - scaleHeight / 2;
    spaceBeforeCurrentGroup = Math.max(0, spaceBeforeCurrentGroup);
    for (let i = 1; i < views.length; i++) {
        const view = views[i];
        const prev = views[i - 1];
        const height = prev._internal_height(rendererOptions, false);
        const coordinate = view._internal_getFixedCoordinate();
        const prevFixedCoordinate = prev._internal_getFixedCoordinate();
        const overlap = direction === 1
            ? coordinate > prevFixedCoordinate - height
            : coordinate < prevFixedCoordinate + height;
        if (overlap) {
            const fixedCoordinate = prevFixedCoordinate - height * direction;
            view._internal_setFixedCoordinate(fixedCoordinate);
            const edgePoint = fixedCoordinate - direction * height / 2;
            const outOfViewport = direction === 1 ? edgePoint < 0 : edgePoint > scaleHeight;
            if (outOfViewport && spaceBeforeCurrentGroup > 0) {
                // shift the whole group up or down
                const desiredGroupShift = direction === 1 ? -1 - edgePoint : edgePoint - scaleHeight;
                const possibleShift = Math.min(desiredGroupShift, spaceBeforeCurrentGroup);
                for (let k = currentGroupStart; k < views.length; k++) {
                    views[k]._internal_setFixedCoordinate(views[k]._internal_getFixedCoordinate() + direction * possibleShift);
                }
                spaceBeforeCurrentGroup -= possibleShift;
            }
        }
        else {
            currentGroupStart = i;
            spaceBeforeCurrentGroup = direction === 1
                ? prevFixedCoordinate - height - coordinate
                : coordinate - (prevFixedCoordinate + height);
        }
    }
}
function priceScaleCrosshairLabelVisible(crosshair) {
    return crosshair.mode !== 2 /* CrosshairMode.Hidden */ && crosshair.horzLine.visible && crosshair.horzLine.labelVisible;
}
class PriceAxisWidget {
    constructor(pane, options, rendererOptionsProvider, side) {
        this._private__priceScale = null;
        this._private__size = null;
        this._private__mousedown = false;
        this._private__widthCache = new TextWidthCache(200);
        this._private__font = null;
        this._private__prevOptimalWidth = 0;
        this._private__isSettingSize = false;
        this._private__canvasSuggestedBitmapSizeChangedHandler = () => {
            if (this._private__isSettingSize) {
                return;
            }
            this._private__pane._internal_chart()._internal_model()._internal_lightUpdate();
        };
        this._private__topCanvasSuggestedBitmapSizeChangedHandler = () => {
            if (this._private__isSettingSize) {
                return;
            }
            this._private__pane._internal_chart()._internal_model()._internal_lightUpdate();
        };
        this._private__pane = pane;
        this._private__options = options;
        this._private__layoutOptions = options['layout'];
        this._private__rendererOptionsProvider = rendererOptionsProvider;
        this._private__isLeft = side === 'left';
        this._private__sourcePaneViews = buildPriceAxisViewsGetter('normal', side);
        this._private__sourceTopPaneViews = buildPriceAxisViewsGetter('top', side);
        this._private__sourceBottomPaneViews = buildPriceAxisViewsGetter('bottom', side);
        this._private__cell = document.createElement('div');
        this._private__cell.style.height = '100%';
        this._private__cell.style.overflow = 'hidden';
        this._private__cell.style.width = '25px';
        this._private__cell.style.left = '0';
        this._private__cell.style.position = 'relative';
        this._private__canvasBinding = createBoundCanvas(this._private__cell, size$1({ width: 16, height: 16 }));
        this._private__canvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        const canvas = this._private__canvasBinding.canvasElement;
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '1';
        canvas.style.left = '0';
        canvas.style.top = '0';
        this._private__topCanvasBinding = createBoundCanvas(this._private__cell, size$1({ width: 16, height: 16 }));
        this._private__topCanvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__topCanvasSuggestedBitmapSizeChangedHandler);
        const topCanvas = this._private__topCanvasBinding.canvasElement;
        topCanvas.style.position = 'absolute';
        topCanvas.style.zIndex = '2';
        topCanvas.style.left = '0';
        topCanvas.style.top = '0';
        const handler = {
            _internal_mouseDownEvent: this._private__mouseDownEvent.bind(this),
            _internal_touchStartEvent: this._private__mouseDownEvent.bind(this),
            _internal_pressedMouseMoveEvent: this._private__pressedMouseMoveEvent.bind(this),
            _internal_touchMoveEvent: this._private__pressedMouseMoveEvent.bind(this),
            _internal_mouseDownOutsideEvent: this._private__mouseDownOutsideEvent.bind(this),
            _internal_mouseUpEvent: this._private__mouseUpEvent.bind(this),
            _internal_touchEndEvent: this._private__mouseUpEvent.bind(this),
            _internal_mouseDoubleClickEvent: this._private__mouseDoubleClickEvent.bind(this),
            _internal_doubleTapEvent: this._private__mouseDoubleClickEvent.bind(this),
            _internal_mouseEnterEvent: this._private__mouseEnterEvent.bind(this),
            _internal_mouseLeaveEvent: this._private__mouseLeaveEvent.bind(this),
        };
        this._private__mouseEventHandler = new MouseEventHandler(this._private__topCanvasBinding.canvasElement, handler, {
            _internal_treatVertTouchDragAsPageScroll: () => !this._private__options['handleScroll'].vertTouchDrag,
            _internal_treatHorzTouchDragAsPageScroll: () => true,
        });
    }
    _internal_destroy() {
        this._private__mouseEventHandler._internal_destroy();
        this._private__topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__topCanvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__topCanvasBinding.canvasElement);
        this._private__topCanvasBinding.dispose();
        this._private__canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__canvasBinding.canvasElement);
        this._private__canvasBinding.dispose();
        if (this._private__priceScale !== null) {
            this._private__priceScale._internal_onMarksChanged()._internal_unsubscribeAll(this);
        }
        this._private__priceScale = null;
    }
    _internal_getElement() {
        return this._private__cell;
    }
    _internal_fontSize() {
        return this._private__layoutOptions.fontSize;
    }
    _internal_rendererOptions() {
        const options = this._private__rendererOptionsProvider._internal_options();
        const isFontChanged = this._private__font !== options._internal_font;
        if (isFontChanged) {
            this._private__widthCache._internal_reset();
            this._private__font = options._internal_font;
        }
        return options;
    }
    _internal_optimalWidth() {
        if (this._private__priceScale === null) {
            return 0;
        }
        let tickMarkMaxWidth = 0;
        const rendererOptions = this._internal_rendererOptions();
        const ctx = ensureNotNull(this._private__canvasBinding.canvasElement.getContext('2d', {
            colorSpace: this._private__pane._internal_chart()._internal_options().layout.colorSpace,
        }));
        ctx.save();
        const tickMarks = this._private__priceScale._internal_marks();
        ctx.font = this._private__baseFont();
        if (tickMarks.length > 0) {
            tickMarkMaxWidth = Math.max(this._private__widthCache._internal_measureText(ctx, tickMarks[0]._internal_label), this._private__widthCache._internal_measureText(ctx, tickMarks[tickMarks.length - 1]._internal_label));
        }
        const views = this._private__backLabels();
        for (let j = views.length; j--;) {
            const width = this._private__widthCache._internal_measureText(ctx, views[j]._internal_text());
            if (width > tickMarkMaxWidth) {
                tickMarkMaxWidth = width;
            }
        }
        const firstValue = this._private__priceScale._internal_firstValue();
        if (firstValue !== null &&
            this._private__size !== null &&
            priceScaleCrosshairLabelVisible(this._private__options.crosshair)) {
            const topValue = this._private__priceScale._internal_coordinateToPrice(1, firstValue);
            const bottomValue = this._private__priceScale._internal_coordinateToPrice(this._private__size.height - 2, firstValue);
            tickMarkMaxWidth = Math.max(tickMarkMaxWidth, this._private__widthCache._internal_measureText(ctx, this._private__priceScale._internal_formatPrice(Math.floor(Math.min(topValue, bottomValue)) + 0.11111111111111, firstValue)), this._private__widthCache._internal_measureText(ctx, this._private__priceScale._internal_formatPrice(Math.ceil(Math.max(topValue, bottomValue)) - 0.11111111111111, firstValue)));
        }
        ctx.restore();
        const resultTickMarksMaxWidth = tickMarkMaxWidth || 34 /* Constants.DefaultOptimalWidth */;
        const res = Math.ceil(rendererOptions._internal_borderSize +
            rendererOptions._internal_tickLength +
            rendererOptions._internal_paddingInner +
            rendererOptions._internal_paddingOuter +
            5 /* Constants.LabelOffset */ +
            resultTickMarksMaxWidth);
        // make it even, remove this after migration to perfect fancy canvas
        return suggestPriceScaleWidth(res);
    }
    _internal_setSize(newSize) {
        if (this._private__size === null || !equalSizes(this._private__size, newSize)) {
            this._private__size = newSize;
            this._private__isSettingSize = true;
            this._private__canvasBinding.resizeCanvasElement(newSize);
            this._private__topCanvasBinding.resizeCanvasElement(newSize);
            this._private__isSettingSize = false;
            this._private__cell.style.width = `${newSize.width}px`;
            this._private__cell.style.height = `${newSize.height}px`;
        }
    }
    _internal_getWidth() {
        return ensureNotNull(this._private__size).width;
    }
    _internal_setPriceScale(priceScale) {
        if (this._private__priceScale === priceScale) {
            return;
        }
        if (this._private__priceScale !== null) {
            this._private__priceScale._internal_onMarksChanged()._internal_unsubscribeAll(this);
        }
        this._private__priceScale = priceScale;
        priceScale._internal_onMarksChanged()._internal_subscribe(this._private__onMarksChanged.bind(this), this);
    }
    _internal_priceScale() {
        return this._private__priceScale;
    }
    _internal_reset() {
        const pane = this._private__pane._internal_state();
        const model = this._private__pane._internal_chart()._internal_model();
        model._internal_resetPriceScale(pane, ensureNotNull(this._internal_priceScale()));
    }
    _internal_paint(type) {
        if (this._private__size === null) {
            return;
        }
        const canvasOptions = {
            colorSpace: this._private__pane._internal_chart()._internal_options().layout.colorSpace,
        };
        if (type !== 1 /* InvalidationLevel.Cursor */) {
            this._private__alignLabels();
            this._private__canvasBinding.applySuggestedBitmapSize();
            const target = tryCreateCanvasRenderingTarget2D(this._private__canvasBinding, canvasOptions);
            if (target !== null) {
                target.useBitmapCoordinateSpace((scope) => {
                    this._private__drawBackground(scope);
                    this._private__drawBorder(scope);
                });
                this._private__pane._internal_drawAdditionalSources(target, this._private__sourceBottomPaneViews);
                this._private__drawTickMarks(target);
                this._private__pane._internal_drawAdditionalSources(target, this._private__sourcePaneViews);
                this._private__drawBackLabels(target);
            }
        }
        this._private__topCanvasBinding.applySuggestedBitmapSize();
        const topTarget = tryCreateCanvasRenderingTarget2D(this._private__topCanvasBinding, canvasOptions);
        if (topTarget !== null) {
            topTarget.useBitmapCoordinateSpace(({ context: ctx, bitmapSize }) => {
                ctx.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
            });
            this._private__drawCrosshairLabel(topTarget);
            this._private__pane._internal_drawAdditionalSources(topTarget, this._private__sourceTopPaneViews);
        }
    }
    _internal_getBitmapSize() {
        return this._private__canvasBinding.bitmapSize;
    }
    _internal_drawBitmap(ctx, x, y) {
        const bitmapSize = this._internal_getBitmapSize();
        if (bitmapSize.width > 0 && bitmapSize.height > 0) {
            ctx.drawImage(this._private__canvasBinding.canvasElement, x, y);
        }
    }
    _internal_update() {
        // this call has side-effect - it regenerates marks on the price scale
        this._private__priceScale?._internal_marks();
    }
    _private__mouseDownEvent(e) {
        if (this._private__priceScale === null || this._private__priceScale._internal_isEmpty() || !this._private__options['handleScale'].axisPressedMouseMove.price) {
            return;
        }
        const model = this._private__pane._internal_chart()._internal_model();
        const pane = this._private__pane._internal_state();
        this._private__mousedown = true;
        model._internal_startScalePrice(pane, this._private__priceScale, e.localY);
    }
    _private__pressedMouseMoveEvent(e) {
        if (this._private__priceScale === null || !this._private__options['handleScale'].axisPressedMouseMove.price) {
            return;
        }
        const model = this._private__pane._internal_chart()._internal_model();
        const pane = this._private__pane._internal_state();
        const priceScale = this._private__priceScale;
        model._internal_scalePriceTo(pane, priceScale, e.localY);
    }
    _private__mouseDownOutsideEvent() {
        if (this._private__priceScale === null || !this._private__options['handleScale'].axisPressedMouseMove.price) {
            return;
        }
        const model = this._private__pane._internal_chart()._internal_model();
        const pane = this._private__pane._internal_state();
        const priceScale = this._private__priceScale;
        if (this._private__mousedown) {
            this._private__mousedown = false;
            model._internal_endScalePrice(pane, priceScale);
        }
    }
    _private__mouseUpEvent(e) {
        if (this._private__priceScale === null || !this._private__options['handleScale'].axisPressedMouseMove.price) {
            return;
        }
        const model = this._private__pane._internal_chart()._internal_model();
        const pane = this._private__pane._internal_state();
        this._private__mousedown = false;
        model._internal_endScalePrice(pane, this._private__priceScale);
    }
    _private__mouseDoubleClickEvent(e) {
        if (this._private__options['handleScale'].axisDoubleClickReset.price) {
            this._internal_reset();
        }
    }
    _private__mouseEnterEvent(e) {
        if (this._private__priceScale === null) {
            return;
        }
        const model = this._private__pane._internal_chart()._internal_model();
        if (model._internal_options()['handleScale'].axisPressedMouseMove.price && !this._private__priceScale._internal_isPercentage() && !this._private__priceScale._internal_isIndexedTo100()) {
            this._private__setCursor(1 /* CursorType.NsResize */);
        }
    }
    _private__mouseLeaveEvent(e) {
        this._private__setCursor(0 /* CursorType.Default */);
    }
    _private__backLabels() {
        const res = [];
        const priceScale = (this._private__priceScale === null) ? undefined : this._private__priceScale;
        const addViewsForSources = (sources) => {
            for (let i = 0; i < sources.length; ++i) {
                const source = sources[i];
                const views = source._internal_priceAxisViews(this._private__pane._internal_state(), priceScale);
                for (let j = 0; j < views.length; j++) {
                    res.push(views[j]);
                }
            }
        };
        // calculate max and min coordinates for views on selection
        // crosshair individually
        addViewsForSources(this._private__pane._internal_state()._internal_orderedSources());
        return res;
    }
    _private__drawBackground({ context: ctx, bitmapSize }) {
        const { width, height } = bitmapSize;
        const model = this._private__pane._internal_state()._internal_model();
        const topColor = model._internal_backgroundTopColor();
        const bottomColor = model._internal_backgroundBottomColor();
        if (topColor === bottomColor) {
            clearRect(ctx, 0, 0, width, height, topColor);
        }
        else {
            clearRectWithGradient(ctx, 0, 0, width, height, topColor, bottomColor);
        }
    }
    _private__drawBorder({ context: ctx, bitmapSize, horizontalPixelRatio }) {
        if (this._private__size === null || this._private__priceScale === null || !this._private__priceScale._internal_options().borderVisible) {
            return;
        }
        ctx.fillStyle = this._private__priceScale._internal_options().borderColor;
        const borderSize = Math.max(1, Math.floor(this._internal_rendererOptions()._internal_borderSize * horizontalPixelRatio));
        let left;
        if (this._private__isLeft) {
            left = bitmapSize.width - borderSize;
        }
        else {
            left = 0;
        }
        ctx.fillRect(left, 0, borderSize, bitmapSize.height);
    }
    _private__drawTickMarks(target) {
        if (this._private__size === null || this._private__priceScale === null) {
            return;
        }
        const tickMarks = this._private__priceScale._internal_marks();
        const priceScaleOptions = this._private__priceScale._internal_options();
        const rendererOptions = this._internal_rendererOptions();
        const tickMarkLeftX = this._private__isLeft ?
            (this._private__size.width - rendererOptions._internal_tickLength) :
            0;
        if (priceScaleOptions.borderVisible && priceScaleOptions.ticksVisible) {
            target.useBitmapCoordinateSpace(({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) => {
                ctx.fillStyle = priceScaleOptions.borderColor;
                const tickHeight = Math.max(1, Math.floor(verticalPixelRatio));
                const tickOffset = Math.floor(verticalPixelRatio * 0.5);
                const tickLength = Math.round(rendererOptions._internal_tickLength * horizontalPixelRatio);
                ctx.beginPath();
                for (const tickMark of tickMarks) {
                    ctx.rect(Math.floor(tickMarkLeftX * horizontalPixelRatio), Math.round(tickMark._internal_coord * verticalPixelRatio) - tickOffset, tickLength, tickHeight);
                }
                ctx.fill();
            });
        }
        target.useMediaCoordinateSpace(({ context: ctx }) => {
            ctx.font = this._private__baseFont();
            ctx.fillStyle = priceScaleOptions.textColor ?? this._private__layoutOptions.textColor;
            ctx.textAlign = this._private__isLeft ? 'right' : 'left';
            ctx.textBaseline = 'middle';
            const textLeftX = this._private__isLeft ?
                Math.round(tickMarkLeftX - rendererOptions._internal_paddingInner) :
                Math.round(tickMarkLeftX + rendererOptions._internal_tickLength + rendererOptions._internal_paddingInner);
            const yMidCorrections = tickMarks.map((mark) => this._private__widthCache._internal_yMidCorrection(ctx, mark._internal_label));
            for (let i = tickMarks.length; i--;) {
                const tickMark = tickMarks[i];
                ctx.fillText(tickMark._internal_label, textLeftX, tickMark._internal_coord + yMidCorrections[i]);
            }
        });
    }
    _private__alignLabels() {
        if (this._private__size === null || this._private__priceScale === null) {
            return;
        }
        let center = this._private__size.height / 2;
        const views = [];
        const orderedSources = this._private__priceScale._internal_orderedSources().slice(); // Copy of array
        const pane = this._private__pane;
        const paneState = pane._internal_state();
        const rendererOptions = this._internal_rendererOptions();
        // if we are default price scale, append labels from no-scale
        const isDefault = this._private__priceScale === paneState._internal_defaultVisiblePriceScale();
        if (isDefault) {
            this._private__pane._internal_state()._internal_orderedSources().forEach((source) => {
                if (paneState._internal_isOverlay(source)) {
                    orderedSources.push(source);
                }
            });
        }
        // we can use any, but let's use the first source as "center" one
        const centerSource = this._private__priceScale._internal_dataSources()[0];
        const priceScale = this._private__priceScale;
        const updateForSources = (sources) => {
            sources.forEach((source) => {
                const sourceViews = source._internal_priceAxisViews(paneState, priceScale);
                // never align selected sources
                sourceViews.forEach((view) => {
                    view._internal_setFixedCoordinate(null);
                    if (view._internal_isVisible()) {
                        views.push(view);
                    }
                });
                if (centerSource === source && sourceViews.length > 0) {
                    center = sourceViews[0]._internal_coordinate();
                }
            });
        };
        // crosshair individually
        updateForSources(orderedSources);
        views.forEach((view) => view._internal_setFixedCoordinate(view._internal_coordinate()));
        const options = this._private__priceScale._internal_options();
        if (!options.alignLabels) {
            return;
        }
        this._private__fixLabelOverlap(views, rendererOptions, center);
    }
    _private__fixLabelOverlap(views, rendererOptions, center) {
        if (this._private__size === null) {
            return;
        }
        // split into two parts
        const top = views.filter((view) => view._internal_coordinate() <= center);
        const bottom = views.filter((view) => view._internal_coordinate() > center);
        // sort top from center to top
        top.sort((l, r) => r._internal_coordinate() - l._internal_coordinate());
        // share center label
        if (top.length && bottom.length) {
            bottom.push(top[0]);
        }
        bottom.sort((l, r) => l._internal_coordinate() - r._internal_coordinate());
        for (const view of views) {
            const halfHeight = Math.floor(view._internal_height(rendererOptions) / 2);
            const coordinate = view._internal_coordinate();
            if (coordinate > -halfHeight && coordinate < halfHeight) {
                view._internal_setFixedCoordinate(halfHeight);
            }
            if (coordinate > (this._private__size.height - halfHeight) && coordinate < this._private__size.height + halfHeight) {
                view._internal_setFixedCoordinate(this._private__size.height - halfHeight);
            }
        }
        recalculateOverlapping(top, 1, this._private__size.height, rendererOptions);
        recalculateOverlapping(bottom, -1, this._private__size.height, rendererOptions);
    }
    _private__drawBackLabels(target) {
        if (this._private__size === null) {
            return;
        }
        const views = this._private__backLabels();
        const rendererOptions = this._internal_rendererOptions();
        const align = this._private__isLeft ? 'right' : 'left';
        views.forEach((view) => {
            if (view._internal_isAxisLabelVisible()) {
                const renderer = view._internal_renderer(ensureNotNull(this._private__priceScale));
                renderer._internal_draw(target, rendererOptions, this._private__widthCache, align);
            }
        });
    }
    _private__drawCrosshairLabel(target) {
        if (this._private__size === null || this._private__priceScale === null) {
            return;
        }
        const model = this._private__pane._internal_chart()._internal_model();
        const views = []; // array of arrays
        const pane = this._private__pane._internal_state();
        const v = model._internal_crosshairSource()._internal_priceAxisViews(pane, this._private__priceScale);
        if (v.length) {
            views.push(v);
        }
        const ro = this._internal_rendererOptions();
        const align = this._private__isLeft ? 'right' : 'left';
        views.forEach((arr) => {
            arr.forEach((view) => {
                view._internal_renderer(ensureNotNull(this._private__priceScale))._internal_draw(target, ro, this._private__widthCache, align);
            });
        });
    }
    _private__setCursor(type) {
        this._private__cell.style.cursor = type === 1 /* CursorType.NsResize */ ? 'ns-resize' : 'default';
    }
    _private__onMarksChanged() {
        const width = this._internal_optimalWidth();
        // avoid price scale is shrunk
        // using < instead !== to avoid infinite changes
        if (this._private__prevOptimalWidth < width) {
            this._private__pane._internal_chart()._internal_model()._internal_fullUpdate();
        }
        this._private__prevOptimalWidth = width;
    }
    _private__baseFont() {
        return makeFont(this._private__layoutOptions.fontSize, this._private__layoutOptions.fontFamily);
    }
}

function sourceBottomPaneViews$1(source, pane) {
    return source._internal_bottomPaneViews?.(pane) ?? [];
}
function sourcePaneViews$1(source, pane) {
    return source._internal_paneViews?.(pane) ?? [];
}
function sourceLabelPaneViews(source, pane) {
    return source._internal_labelPaneViews?.(pane) ?? [];
}
function sourceTopPaneViews$1(source, pane) {
    return source._internal_topPaneViews?.(pane) ?? [];
}
class PaneWidget {
    constructor(chart, state) {
        this._private__size = size$1({ width: 0, height: 0 });
        this._private__leftPriceAxisWidget = null;
        this._private__rightPriceAxisWidget = null;
        this._private__attributionLogoWidget = null;
        this._private__startScrollingPos = null;
        this._private__isScrolling = false;
        this._private__clicked = new Delegate();
        this._private__dblClicked = new Delegate();
        this._private__prevPinchScale = 0;
        this._private__longTap = false;
        this._private__startTrackPoint = null;
        this._private__exitTrackingModeOnNextTry = false;
        this._private__initCrosshairPosition = null;
        this._private__scrollXAnimation = null;
        this._private__isSettingSize = false;
        this._private__canvasSuggestedBitmapSizeChangedHandler = () => {
            if (this._private__isSettingSize || this._private__state === null) {
                return;
            }
            this._private__model()._internal_lightUpdate();
        };
        this._private__topCanvasSuggestedBitmapSizeChangedHandler = () => {
            if (this._private__isSettingSize || this._private__state === null) {
                return;
            }
            this._private__model()._internal_lightUpdate();
        };
        this._private__chart = chart;
        this._private__state = state;
        this._private__state._internal_onDestroyed()._internal_subscribe(this._private__onStateDestroyed.bind(this), this, true);
        this._private__paneCell = document.createElement('td');
        this._private__paneCell.style.padding = '0';
        this._private__paneCell.style.position = 'relative';
        const paneWrapper = document.createElement('div');
        paneWrapper.style.width = '100%';
        paneWrapper.style.height = '100%';
        paneWrapper.style.position = 'relative';
        paneWrapper.style.overflow = 'hidden';
        this._private__leftAxisCell = document.createElement('td');
        this._private__leftAxisCell.style.padding = '0';
        this._private__rightAxisCell = document.createElement('td');
        this._private__rightAxisCell.style.padding = '0';
        this._private__paneCell.appendChild(paneWrapper);
        this._private__canvasBinding = createBoundCanvas(paneWrapper, size$1({ width: 16, height: 16 }));
        this._private__canvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        const canvas = this._private__canvasBinding.canvasElement;
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '1';
        canvas.style.left = '0';
        canvas.style.top = '0';
        this._private__topCanvasBinding = createBoundCanvas(paneWrapper, size$1({ width: 16, height: 16 }));
        this._private__topCanvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__topCanvasSuggestedBitmapSizeChangedHandler);
        const topCanvas = this._private__topCanvasBinding.canvasElement;
        topCanvas.style.position = 'absolute';
        topCanvas.style.zIndex = '2';
        topCanvas.style.left = '0';
        topCanvas.style.top = '0';
        this._private__rowElement = document.createElement('tr');
        this._private__rowElement.appendChild(this._private__leftAxisCell);
        this._private__rowElement.appendChild(this._private__paneCell);
        this._private__rowElement.appendChild(this._private__rightAxisCell);
        this._internal_updatePriceAxisWidgetsStates();
        this._private__mouseEventHandler = new MouseEventHandler(this._private__topCanvasBinding.canvasElement, this, {
            _internal_treatVertTouchDragAsPageScroll: () => this._private__startTrackPoint === null && !this._private__chart._internal_options()['handleScroll'].vertTouchDrag,
            _internal_treatHorzTouchDragAsPageScroll: () => this._private__startTrackPoint === null && !this._private__chart._internal_options()['handleScroll'].horzTouchDrag,
        });
    }
    _internal_destroy() {
        if (this._private__leftPriceAxisWidget !== null) {
            this._private__leftPriceAxisWidget._internal_destroy();
        }
        if (this._private__rightPriceAxisWidget !== null) {
            this._private__rightPriceAxisWidget._internal_destroy();
        }
        this._private__attributionLogoWidget = null;
        this._private__topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__topCanvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__topCanvasBinding.canvasElement);
        this._private__topCanvasBinding.dispose();
        this._private__canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__canvasBinding.canvasElement);
        this._private__canvasBinding.dispose();
        if (this._private__state !== null) {
            this._private__state._internal_onDestroyed()._internal_unsubscribeAll(this);
            this._private__state._internal_destroy();
        }
        this._private__mouseEventHandler._internal_destroy();
    }
    _internal_state() {
        return ensureNotNull(this._private__state);
    }
    _internal_setState(pane) {
        if (this._private__state !== null) {
            this._private__state._internal_onDestroyed()._internal_unsubscribeAll(this);
        }
        this._private__state = pane;
        if (this._private__state !== null) {
            this._private__state._internal_onDestroyed()._internal_subscribe(PaneWidget.prototype._private__onStateDestroyed.bind(this), this, true);
        }
        this._internal_updatePriceAxisWidgetsStates();
        if (this._private__chart._internal_paneWidgets().indexOf(this) === this._private__chart._internal_paneWidgets().length - 1) {
            this._private__attributionLogoWidget = this._private__attributionLogoWidget ?? new AttributionLogoWidget(this._private__paneCell, this._private__chart);
            this._private__attributionLogoWidget._internal_update();
        }
        else {
            this._private__attributionLogoWidget?._internal_removeElement();
            this._private__attributionLogoWidget = null;
        }
    }
    _internal_chart() {
        return this._private__chart;
    }
    _internal_getElement() {
        return this._private__rowElement;
    }
    _internal_updatePriceAxisWidgetsStates() {
        if (this._private__state === null) {
            return;
        }
        this._private__recreatePriceAxisWidgets();
        if (this._private__model()._internal_serieses().length === 0) {
            return;
        }
        if (this._private__leftPriceAxisWidget !== null) {
            const leftPriceScale = this._private__state._internal_leftPriceScale();
            this._private__leftPriceAxisWidget._internal_setPriceScale(ensureNotNull(leftPriceScale));
        }
        if (this._private__rightPriceAxisWidget !== null) {
            const rightPriceScale = this._private__state._internal_rightPriceScale();
            this._private__rightPriceAxisWidget._internal_setPriceScale(ensureNotNull(rightPriceScale));
        }
    }
    _internal_updatePriceAxisWidgets() {
        if (this._private__leftPriceAxisWidget !== null) {
            this._private__leftPriceAxisWidget._internal_update();
        }
        if (this._private__rightPriceAxisWidget !== null) {
            this._private__rightPriceAxisWidget._internal_update();
        }
    }
    _internal_stretchFactor() {
        return this._private__state !== null ? this._private__state._internal_stretchFactor() : 0;
    }
    _internal_setStretchFactor(stretchFactor) {
        if (this._private__state) {
            this._private__state._internal_setStretchFactor(stretchFactor);
        }
    }
    _internal_mouseEnterEvent(event) {
        if (!this._private__state) {
            return;
        }
        this._private__onMouseEvent();
        const x = event.localX;
        const y = event.localY;
        this._private__setCrosshairPosition(x, y, event);
    }
    _internal_mouseDownEvent(event) {
        this._private__onMouseEvent();
        this._private__mouseTouchDownEvent();
        this._private__setCrosshairPosition(event.localX, event.localY, event);
    }
    _internal_mouseMoveEvent(event) {
        if (!this._private__state) {
            return;
        }
        this._private__onMouseEvent();
        const x = event.localX;
        const y = event.localY;
        this._private__setCrosshairPosition(x, y, event);
    }
    _internal_mouseClickEvent(event) {
        if (this._private__state === null) {
            return;
        }
        this._private__onMouseEvent();
        this._private__fireClickedDelegate(event);
    }
    _internal_mouseDoubleClickEvent(event) {
        if (this._private__state === null) {
            return;
        }
        this._private__fireMouseClickDelegate(this._private__dblClicked, event);
    }
    _internal_doubleTapEvent(event) {
        this._internal_mouseDoubleClickEvent(event);
    }
    _internal_pressedMouseMoveEvent(event) {
        this._private__onMouseEvent();
        this._private__pressedMouseTouchMoveEvent(event);
        this._private__setCrosshairPosition(event.localX, event.localY, event);
    }
    _internal_mouseUpEvent(event) {
        if (this._private__state === null) {
            return;
        }
        this._private__onMouseEvent();
        this._private__longTap = false;
        this._private__endScroll(event);
    }
    _internal_tapEvent(event) {
        if (this._private__state === null) {
            return;
        }
        this._private__fireClickedDelegate(event);
    }
    _internal_longTapEvent(event) {
        this._private__longTap = true;
        if (this._private__startTrackPoint === null) {
            const point = { x: event.localX, y: event.localY };
            this._private__startTrackingMode(point, point, event);
        }
    }
    _internal_mouseLeaveEvent(event) {
        if (this._private__state === null) {
            return;
        }
        this._private__onMouseEvent();
        this._private__state._internal_model()._internal_setHoveredSource(null);
        this._private__clearCrosshairPosition();
    }
    _internal_clicked() {
        return this._private__clicked;
    }
    _internal_dblClicked() {
        return this._private__dblClicked;
    }
    _internal_pinchStartEvent() {
        this._private__prevPinchScale = 1;
        this._private__model()._internal_stopTimeScaleAnimation();
    }
    _internal_pinchEvent(middlePoint, scale) {
        if (!this._private__chart._internal_options()['handleScale'].pinch) {
            return;
        }
        const zoomScale = (scale - this._private__prevPinchScale) * 5;
        this._private__prevPinchScale = scale;
        this._private__model()._internal_zoomTime(middlePoint._internal_x, zoomScale);
    }
    _internal_touchStartEvent(event) {
        this._private__longTap = false;
        this._private__exitTrackingModeOnNextTry = this._private__startTrackPoint !== null;
        this._private__mouseTouchDownEvent();
        const crosshair = this._private__model()._internal_crosshairSource();
        if (this._private__startTrackPoint !== null && crosshair._internal_visible()) {
            this._private__initCrosshairPosition = { x: crosshair._internal_appliedX(), y: crosshair._internal_appliedY() };
            this._private__startTrackPoint = { x: event.localX, y: event.localY };
        }
    }
    _internal_touchMoveEvent(event) {
        if (this._private__state === null) {
            return;
        }
        const x = event.localX;
        const y = event.localY;
        if (this._private__startTrackPoint !== null) {
            // tracking mode: move crosshair
            this._private__exitTrackingModeOnNextTry = false;
            const origPoint = ensureNotNull(this._private__initCrosshairPosition);
            const newX = origPoint.x + (x - this._private__startTrackPoint.x);
            const newY = origPoint.y + (y - this._private__startTrackPoint.y);
            this._private__setCrosshairPosition(newX, newY, event);
            return;
        }
        this._private__pressedMouseTouchMoveEvent(event);
    }
    _internal_touchEndEvent(event) {
        if (this._internal_chart()._internal_options().trackingMode.exitMode === 0 /* TrackingModeExitMode.OnTouchEnd */) {
            this._private__exitTrackingModeOnNextTry = true;
        }
        this._private__tryExitTrackingMode();
        this._private__endScroll(event);
    }
    _internal_hitTest(x, y) {
        const state = this._private__state;
        if (state === null) {
            return null;
        }
        return hitTestPane(state, x, y);
    }
    _internal_setPriceAxisSize(width, position) {
        const priceAxisWidget = position === 'left' ? this._private__leftPriceAxisWidget : this._private__rightPriceAxisWidget;
        ensureNotNull(priceAxisWidget)._internal_setSize(size$1({ width, height: this._private__size.height }));
    }
    _internal_getSize() {
        return this._private__size;
    }
    _internal_setSize(newSize) {
        if (equalSizes(this._private__size, newSize)) {
            return;
        }
        this._private__size = newSize;
        this._private__isSettingSize = true;
        this._private__canvasBinding.resizeCanvasElement(newSize);
        this._private__topCanvasBinding.resizeCanvasElement(newSize);
        this._private__isSettingSize = false;
        this._private__paneCell.style.width = newSize.width + 'px';
        this._private__paneCell.style.height = newSize.height + 'px';
    }
    _internal_recalculatePriceScales() {
        const pane = ensureNotNull(this._private__state);
        pane._internal_recalculatePriceScale(pane._internal_leftPriceScale());
        pane._internal_recalculatePriceScale(pane._internal_rightPriceScale());
        for (const source of pane._internal_dataSources()) {
            if (pane._internal_isOverlay(source)) {
                const priceScale = source._internal_priceScale();
                if (priceScale !== null) {
                    pane._internal_recalculatePriceScale(priceScale);
                }
                // for overlay drawings price scale is owner's price scale
                // however owner's price scale could not contain ds
                source._internal_updateAllViews();
            }
        }
        for (const primitive of pane._internal_primitives()) {
            primitive._internal_updateAllViews();
        }
    }
    _internal_getBitmapSize() {
        return this._private__canvasBinding.bitmapSize;
    }
    _internal_drawBitmap(ctx, x, y) {
        const bitmapSize = this._internal_getBitmapSize();
        if (bitmapSize.width > 0 && bitmapSize.height > 0) {
            ctx.drawImage(this._private__canvasBinding.canvasElement, x, y);
        }
    }
    _internal_paint(type) {
        if (type === 0 /* InvalidationLevel.None */) {
            return;
        }
        if (this._private__state === null) {
            return;
        }
        if (type > 1 /* InvalidationLevel.Cursor */) {
            this._internal_recalculatePriceScales();
        }
        if (this._private__leftPriceAxisWidget !== null) {
            this._private__leftPriceAxisWidget._internal_paint(type);
        }
        if (this._private__rightPriceAxisWidget !== null) {
            this._private__rightPriceAxisWidget._internal_paint(type);
        }
        const canvasOptions = {
            colorSpace: this._private__chart._internal_options().layout.colorSpace,
        };
        if (type !== 1 /* InvalidationLevel.Cursor */) {
            this._private__canvasBinding.applySuggestedBitmapSize();
            const target = tryCreateCanvasRenderingTarget2D(this._private__canvasBinding, canvasOptions);
            if (target !== null) {
                target.useBitmapCoordinateSpace((scope) => {
                    this._private__drawBackground(scope);
                });
                if (this._private__state) {
                    this._private__drawSources(target, sourceBottomPaneViews$1);
                    this._private__drawGrid(target);
                    this._private__drawSources(target, sourcePaneViews$1);
                    this._private__drawSources(target, sourceLabelPaneViews);
                }
            }
        }
        this._private__topCanvasBinding.applySuggestedBitmapSize();
        const topTarget = tryCreateCanvasRenderingTarget2D(this._private__topCanvasBinding, canvasOptions);
        if (topTarget !== null) {
            topTarget.useBitmapCoordinateSpace(({ context: ctx, bitmapSize }) => {
                ctx.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
            });
            this._private__drawCrosshair(topTarget);
            this._private__drawSources(topTarget, sourceTopPaneViews$1);
            this._private__drawSources(topTarget, sourceLabelPaneViews);
        }
    }
    _internal_leftPriceAxisWidget() {
        return this._private__leftPriceAxisWidget;
    }
    _internal_rightPriceAxisWidget() {
        return this._private__rightPriceAxisWidget;
    }
    _internal_drawAdditionalSources(target, paneViewsGetter) {
        this._private__drawSources(target, paneViewsGetter);
    }
    _private__onStateDestroyed() {
        if (this._private__state !== null) {
            this._private__state._internal_onDestroyed()._internal_unsubscribeAll(this);
        }
        this._private__state = null;
    }
    _private__fireClickedDelegate(event) {
        this._private__fireMouseClickDelegate(this._private__clicked, event);
    }
    _private__fireMouseClickDelegate(delegate, event) {
        const x = event.localX;
        const y = event.localY;
        if (delegate._internal_hasListeners()) {
            delegate._internal_fire(this._private__model()._internal_timeScale()._internal_coordinateToIndex(x), { x, y }, event);
        }
    }
    _private__drawBackground({ context: ctx, bitmapSize }) {
        const { width, height } = bitmapSize;
        const model = this._private__model();
        const topColor = model._internal_backgroundTopColor();
        const bottomColor = model._internal_backgroundBottomColor();
        if (topColor === bottomColor) {
            clearRect(ctx, 0, 0, width, height, bottomColor);
        }
        else {
            clearRectWithGradient(ctx, 0, 0, width, height, topColor, bottomColor);
        }
    }
    _private__drawGrid(target) {
        const state = ensureNotNull(this._private__state);
        const paneView = state._internal_grid()._internal_paneView();
        const renderer = paneView._internal_renderer(state);
        if (renderer !== null) {
            renderer._internal_draw(target, false);
        }
    }
    _private__drawCrosshair(target) {
        this._private__drawSourceImpl(target, sourcePaneViews$1, drawForeground, this._private__model()._internal_crosshairSource());
    }
    _private__drawSources(target, paneViewsGetter) {
        const state = ensureNotNull(this._private__state);
        const sources = state._internal_orderedSources();
        const panePrimitives = state._internal_primitives();
        for (const panePrimitive of panePrimitives) {
            this._private__drawSourceImpl(target, paneViewsGetter, drawBackground, panePrimitive);
        }
        for (const source of sources) {
            this._private__drawSourceImpl(target, paneViewsGetter, drawBackground, source);
        }
        for (const panePrimitive of panePrimitives) {
            this._private__drawSourceImpl(target, paneViewsGetter, drawForeground, panePrimitive);
        }
        for (const source of sources) {
            this._private__drawSourceImpl(target, paneViewsGetter, drawForeground, source);
        }
    }
    _private__drawSourceImpl(target, paneViewsGetter, drawFn, source) {
        const state = ensureNotNull(this._private__state);
        const hoveredSource = state._internal_model()._internal_hoveredSource();
        const isHovered = hoveredSource !== null && hoveredSource._internal_source === source;
        const objecId = hoveredSource !== null && isHovered && hoveredSource._internal_object !== undefined
            ? hoveredSource._internal_object._internal_hitTestData
            : undefined;
        const drawRendererFn = (renderer) => drawFn(renderer, target, isHovered, objecId);
        drawSourceViews(paneViewsGetter, drawRendererFn, source, state);
    }
    _private__recreatePriceAxisWidgets() {
        if (this._private__state === null) {
            return;
        }
        const chart = this._private__chart;
        const leftAxisVisible = this._private__state._internal_leftPriceScale()._internal_options().visible;
        const rightAxisVisible = this._private__state._internal_rightPriceScale()._internal_options().visible;
        if (!leftAxisVisible && this._private__leftPriceAxisWidget !== null) {
            this._private__leftAxisCell.removeChild(this._private__leftPriceAxisWidget._internal_getElement());
            this._private__leftPriceAxisWidget._internal_destroy();
            this._private__leftPriceAxisWidget = null;
        }
        if (!rightAxisVisible && this._private__rightPriceAxisWidget !== null) {
            this._private__rightAxisCell.removeChild(this._private__rightPriceAxisWidget._internal_getElement());
            this._private__rightPriceAxisWidget._internal_destroy();
            this._private__rightPriceAxisWidget = null;
        }
        const rendererOptionsProvider = chart._internal_model()._internal_rendererOptionsProvider();
        if (leftAxisVisible && this._private__leftPriceAxisWidget === null) {
            this._private__leftPriceAxisWidget = new PriceAxisWidget(this, chart._internal_options(), rendererOptionsProvider, 'left');
            this._private__leftAxisCell.appendChild(this._private__leftPriceAxisWidget._internal_getElement());
        }
        if (rightAxisVisible && this._private__rightPriceAxisWidget === null) {
            this._private__rightPriceAxisWidget = new PriceAxisWidget(this, chart._internal_options(), rendererOptionsProvider, 'right');
            this._private__rightAxisCell.appendChild(this._private__rightPriceAxisWidget._internal_getElement());
        }
    }
    _private__preventScroll(event) {
        return event._internal_isTouch && this._private__longTap || this._private__startTrackPoint !== null;
    }
    _private__correctXCoord(x) {
        return Math.max(0, Math.min(x, this._private__size.width - 1));
    }
    _private__correctYCoord(y) {
        return Math.max(0, Math.min(y, this._private__size.height - 1));
    }
    _private__setCrosshairPosition(x, y, event) {
        this._private__model()._internal_setAndSaveCurrentPosition(this._private__correctXCoord(x), this._private__correctYCoord(y), event, ensureNotNull(this._private__state));
    }
    _private__clearCrosshairPosition() {
        this._private__model()._internal_clearCurrentPosition();
    }
    _private__tryExitTrackingMode() {
        if (this._private__exitTrackingModeOnNextTry) {
            this._private__startTrackPoint = null;
            this._private__clearCrosshairPosition();
        }
    }
    _private__startTrackingMode(startTrackPoint, crossHairPosition, event) {
        this._private__startTrackPoint = startTrackPoint;
        this._private__exitTrackingModeOnNextTry = false;
        this._private__setCrosshairPosition(crossHairPosition.x, crossHairPosition.y, event);
        const crosshair = this._private__model()._internal_crosshairSource();
        this._private__initCrosshairPosition = { x: crosshair._internal_appliedX(), y: crosshair._internal_appliedY() };
    }
    _private__model() {
        return this._private__chart._internal_model();
    }
    _private__endScroll(event) {
        if (!this._private__isScrolling) {
            return;
        }
        const model = this._private__model();
        const state = this._internal_state();
        model._internal_endScrollPrice(state, state._internal_defaultPriceScale());
        this._private__startScrollingPos = null;
        this._private__isScrolling = false;
        model._internal_endScrollTime();
        if (this._private__scrollXAnimation !== null) {
            const startAnimationTime = performance.now();
            const timeScale = model._internal_timeScale();
            this._private__scrollXAnimation._internal_start(timeScale._internal_rightOffset(), startAnimationTime);
            if (!this._private__scrollXAnimation._internal_finished(startAnimationTime)) {
                model._internal_setTimeScaleAnimation(this._private__scrollXAnimation);
            }
        }
    }
    _private__onMouseEvent() {
        this._private__startTrackPoint = null;
    }
    _private__mouseTouchDownEvent() {
        if (!this._private__state) {
            return;
        }
        this._private__model()._internal_stopTimeScaleAnimation();
        if (document.activeElement !== document.body && document.activeElement !== document.documentElement) {
            // If any focusable element except the page itself is focused, remove the focus
            ensureNotNull(document.activeElement).blur();
        }
        else {
            // Clear selection
            const selection = document.getSelection();
            if (selection !== null) {
                selection.removeAllRanges();
            }
        }
        const priceScale = this._private__state._internal_defaultPriceScale();
        if (priceScale._internal_isEmpty() || this._private__model()._internal_timeScale()._internal_isEmpty()) {
            return;
        }
    }
    // eslint-disable-next-line complexity
    _private__pressedMouseTouchMoveEvent(event) {
        if (this._private__state === null) {
            return;
        }
        const model = this._private__model();
        const timeScale = model._internal_timeScale();
        if (timeScale._internal_isEmpty()) {
            return;
        }
        const chartOptions = this._private__chart._internal_options();
        const scrollOptions = chartOptions['handleScroll'];
        const kineticScrollOptions = chartOptions.kineticScroll;
        if ((!scrollOptions.pressedMouseMove || event._internal_isTouch) &&
            (!scrollOptions.horzTouchDrag && !scrollOptions.vertTouchDrag || !event._internal_isTouch)) {
            return;
        }
        const priceScale = this._private__state._internal_defaultPriceScale();
        const now = performance.now();
        if (this._private__startScrollingPos === null && !this._private__preventScroll(event)) {
            this._private__startScrollingPos = {
                x: event.clientX,
                y: event.clientY,
                _internal_timestamp: now,
                _internal_localX: event.localX,
                _internal_localY: event.localY,
            };
        }
        if (this._private__startScrollingPos !== null &&
            !this._private__isScrolling &&
            (this._private__startScrollingPos.x !== event.clientX || this._private__startScrollingPos.y !== event.clientY)) {
            if (event._internal_isTouch && kineticScrollOptions.touch || !event._internal_isTouch && kineticScrollOptions.mouse) {
                const barSpacing = timeScale._internal_barSpacing();
                this._private__scrollXAnimation = new KineticAnimation(0.2 /* KineticScrollConstants.MinScrollSpeed */ / barSpacing, 7 /* KineticScrollConstants.MaxScrollSpeed */ / barSpacing, 0.997 /* KineticScrollConstants.DumpingCoeff */, 15 /* KineticScrollConstants.ScrollMinMove */ / barSpacing);
                this._private__scrollXAnimation._internal_addPosition(timeScale._internal_rightOffset(), this._private__startScrollingPos._internal_timestamp);
            }
            else {
                this._private__scrollXAnimation = null;
            }
            if (!priceScale._internal_isEmpty()) {
                model._internal_startScrollPrice(this._private__state, priceScale, event.localY);
            }
            model._internal_startScrollTime(event.localX);
            this._private__isScrolling = true;
        }
        if (this._private__isScrolling) {
            // this allows scrolling not default price scales
            if (!priceScale._internal_isEmpty()) {
                model._internal_scrollPriceTo(this._private__state, priceScale, event.localY);
            }
            model._internal_scrollTimeTo(event.localX);
            if (this._private__scrollXAnimation !== null) {
                this._private__scrollXAnimation._internal_addPosition(timeScale._internal_rightOffset(), now);
            }
        }
    }
}

class PriceAxisStub {
    constructor(side, options, params, borderVisible, bottomColor) {
        this._private__invalidated = true;
        this._private__size = size$1({ width: 0, height: 0 });
        this._private__canvasSuggestedBitmapSizeChangedHandler = () => this._internal_paint(3 /* InvalidationLevel.Full */);
        this._private__isLeft = side === 'left';
        this._private__rendererOptionsProvider = params._internal_rendererOptionsProvider;
        this._private__options = options;
        this._private__borderVisible = borderVisible;
        this._private__bottomColor = bottomColor;
        this._private__cell = document.createElement('div');
        this._private__cell.style.width = '25px';
        this._private__cell.style.height = '100%';
        this._private__cell.style.overflow = 'hidden';
        this._private__canvasBinding = createBoundCanvas(this._private__cell, size$1({ width: 16, height: 16 }));
        this._private__canvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
    }
    _internal_destroy() {
        this._private__canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__canvasBinding.canvasElement);
        this._private__canvasBinding.dispose();
    }
    _internal_getElement() {
        return this._private__cell;
    }
    _internal_getSize() {
        return this._private__size;
    }
    _internal_setSize(newSize) {
        if (!equalSizes(this._private__size, newSize)) {
            this._private__size = newSize;
            this._private__canvasBinding.resizeCanvasElement(newSize);
            this._private__cell.style.width = `${newSize.width}px`;
            this._private__cell.style.height = `${newSize.height}px`;
            this._private__invalidated = true;
        }
    }
    _internal_paint(type) {
        if (type < 3 /* InvalidationLevel.Full */ && !this._private__invalidated) {
            return;
        }
        if (this._private__size.width === 0 || this._private__size.height === 0) {
            return;
        }
        this._private__invalidated = false;
        this._private__canvasBinding.applySuggestedBitmapSize();
        const target = tryCreateCanvasRenderingTarget2D(this._private__canvasBinding, {
            colorSpace: this._private__options.layout.colorSpace,
        });
        if (target !== null) {
            target.useBitmapCoordinateSpace((scope) => {
                this._private__drawBackground(scope);
                this._private__drawBorder(scope);
            });
        }
    }
    _internal_getBitmapSize() {
        return this._private__canvasBinding.bitmapSize;
    }
    _internal_drawBitmap(ctx, x, y) {
        const bitmapSize = this._internal_getBitmapSize();
        if (bitmapSize.width > 0 && bitmapSize.height > 0) {
            ctx.drawImage(this._private__canvasBinding.canvasElement, x, y);
        }
    }
    _private__drawBorder({ context: ctx, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) {
        if (!this._private__borderVisible()) {
            return;
        }
        ctx.fillStyle = this._private__options.timeScale.borderColor;
        const horzBorderSize = Math.floor(this._private__rendererOptionsProvider._internal_options()._internal_borderSize * horizontalPixelRatio);
        const vertBorderSize = Math.floor(this._private__rendererOptionsProvider._internal_options()._internal_borderSize * verticalPixelRatio);
        const left = (this._private__isLeft) ? bitmapSize.width - horzBorderSize : 0;
        ctx.fillRect(left, 0, horzBorderSize, vertBorderSize);
    }
    _private__drawBackground({ context: ctx, bitmapSize }) {
        clearRect(ctx, 0, 0, bitmapSize.width, bitmapSize.height, this._private__bottomColor());
    }
}

function buildTimeAxisViewsGetter(zOrder) {
    return (source) => source._internal_timePaneViews?.(zOrder) ?? [];
}
const sourcePaneViews = buildTimeAxisViewsGetter('normal');
const sourceTopPaneViews = buildTimeAxisViewsGetter('top');
const sourceBottomPaneViews = buildTimeAxisViewsGetter('bottom');
class TimeAxisWidget {
    constructor(chartWidget, horzScaleBehavior) {
        this._private__leftStub = null;
        this._private__rightStub = null;
        this._private__rendererOptions = null;
        this._private__mouseDown = false;
        this._private__size = size$1({ width: 0, height: 0 });
        this._private__sizeChanged = new Delegate();
        this._private__widthCache = new TextWidthCache(5);
        this._private__isSettingSize = false;
        this._private__canvasSuggestedBitmapSizeChangedHandler = () => {
            if (!this._private__isSettingSize) {
                this._private__chart._internal_model()._internal_lightUpdate();
            }
        };
        this._private__topCanvasSuggestedBitmapSizeChangedHandler = () => {
            if (!this._private__isSettingSize) {
                this._private__chart._internal_model()._internal_lightUpdate();
            }
        };
        this._private__chart = chartWidget;
        this._private__horzScaleBehavior = horzScaleBehavior;
        this._private__options = chartWidget._internal_options()['layout'];
        this._private__element = document.createElement('tr');
        this._private__leftStubCell = document.createElement('td');
        this._private__leftStubCell.style.padding = '0';
        this._private__rightStubCell = document.createElement('td');
        this._private__rightStubCell.style.padding = '0';
        this._private__cell = document.createElement('td');
        this._private__cell.style.height = '25px';
        this._private__cell.style.padding = '0';
        this._private__dv = document.createElement('div');
        this._private__dv.style.width = '100%';
        this._private__dv.style.height = '100%';
        this._private__dv.style.position = 'relative';
        this._private__dv.style.overflow = 'hidden';
        this._private__cell.appendChild(this._private__dv);
        this._private__canvasBinding = createBoundCanvas(this._private__dv, size$1({ width: 16, height: 16 }));
        this._private__canvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        const canvas = this._private__canvasBinding.canvasElement;
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '1';
        canvas.style.left = '0';
        canvas.style.top = '0';
        this._private__topCanvasBinding = createBoundCanvas(this._private__dv, size$1({ width: 16, height: 16 }));
        this._private__topCanvasBinding.subscribeSuggestedBitmapSizeChanged(this._private__topCanvasSuggestedBitmapSizeChangedHandler);
        const topCanvas = this._private__topCanvasBinding.canvasElement;
        topCanvas.style.position = 'absolute';
        topCanvas.style.zIndex = '2';
        topCanvas.style.left = '0';
        topCanvas.style.top = '0';
        this._private__element.appendChild(this._private__leftStubCell);
        this._private__element.appendChild(this._private__cell);
        this._private__element.appendChild(this._private__rightStubCell);
        this._private__recreateStubs();
        this._private__chart._internal_model()._internal_priceScalesOptionsChanged()._internal_subscribe(this._private__recreateStubs.bind(this), this);
        this._private__mouseEventHandler = new MouseEventHandler(this._private__topCanvasBinding.canvasElement, this, {
            _internal_treatVertTouchDragAsPageScroll: () => true,
            _internal_treatHorzTouchDragAsPageScroll: () => !this._private__chart._internal_options()['handleScroll'].horzTouchDrag,
        });
    }
    _internal_destroy() {
        this._private__mouseEventHandler._internal_destroy();
        if (this._private__leftStub !== null) {
            this._private__leftStub._internal_destroy();
        }
        if (this._private__rightStub !== null) {
            this._private__rightStub._internal_destroy();
        }
        this._private__topCanvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__topCanvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__topCanvasBinding.canvasElement);
        this._private__topCanvasBinding.dispose();
        this._private__canvasBinding.unsubscribeSuggestedBitmapSizeChanged(this._private__canvasSuggestedBitmapSizeChangedHandler);
        releaseCanvas(this._private__canvasBinding.canvasElement);
        this._private__canvasBinding.dispose();
    }
    _internal_getElement() {
        return this._private__element;
    }
    _internal_leftStub() {
        return this._private__leftStub;
    }
    _internal_rightStub() {
        return this._private__rightStub;
    }
    _internal_mouseDownEvent(event) {
        if (this._private__mouseDown) {
            return;
        }
        this._private__mouseDown = true;
        const model = this._private__chart._internal_model();
        if (model._internal_timeScale()._internal_isEmpty() || !this._private__chart._internal_options()['handleScale'].axisPressedMouseMove.time) {
            return;
        }
        model._internal_startScaleTime(event.localX);
    }
    _internal_touchStartEvent(event) {
        this._internal_mouseDownEvent(event);
    }
    _internal_mouseDownOutsideEvent() {
        const model = this._private__chart._internal_model();
        if (!model._internal_timeScale()._internal_isEmpty() && this._private__mouseDown) {
            this._private__mouseDown = false;
            if (this._private__chart._internal_options()['handleScale'].axisPressedMouseMove.time) {
                model._internal_endScaleTime();
            }
        }
    }
    _internal_pressedMouseMoveEvent(event) {
        const model = this._private__chart._internal_model();
        if (model._internal_timeScale()._internal_isEmpty() || !this._private__chart._internal_options()['handleScale'].axisPressedMouseMove.time) {
            return;
        }
        model._internal_scaleTimeTo(event.localX);
    }
    _internal_touchMoveEvent(event) {
        this._internal_pressedMouseMoveEvent(event);
    }
    _internal_mouseUpEvent() {
        this._private__mouseDown = false;
        const model = this._private__chart._internal_model();
        if (model._internal_timeScale()._internal_isEmpty() && !this._private__chart._internal_options()['handleScale'].axisPressedMouseMove.time) {
            return;
        }
        model._internal_endScaleTime();
    }
    _internal_touchEndEvent() {
        this._internal_mouseUpEvent();
    }
    _internal_mouseDoubleClickEvent() {
        if (this._private__chart._internal_options()['handleScale'].axisDoubleClickReset.time) {
            this._private__chart._internal_model()._internal_resetTimeScale();
        }
    }
    _internal_doubleTapEvent() {
        this._internal_mouseDoubleClickEvent();
    }
    _internal_mouseEnterEvent() {
        if (this._private__chart._internal_model()._internal_options()['handleScale'].axisPressedMouseMove.time) {
            this._private__setCursor(1 /* CursorType.EwResize */);
        }
    }
    _internal_mouseLeaveEvent() {
        this._private__setCursor(0 /* CursorType.Default */);
    }
    _internal_getSize() {
        return this._private__size;
    }
    _internal_sizeChanged() {
        return this._private__sizeChanged;
    }
    _internal_setSizes(timeAxisSize, leftStubWidth, rightStubWidth) {
        if (!equalSizes(this._private__size, timeAxisSize)) {
            this._private__size = timeAxisSize;
            this._private__isSettingSize = true;
            this._private__canvasBinding.resizeCanvasElement(timeAxisSize);
            this._private__topCanvasBinding.resizeCanvasElement(timeAxisSize);
            this._private__isSettingSize = false;
            this._private__cell.style.width = `${timeAxisSize.width}px`;
            this._private__cell.style.height = `${timeAxisSize.height}px`;
            this._private__sizeChanged._internal_fire(timeAxisSize);
        }
        if (this._private__leftStub !== null) {
            this._private__leftStub._internal_setSize(size$1({ width: leftStubWidth, height: timeAxisSize.height }));
        }
        if (this._private__rightStub !== null) {
            this._private__rightStub._internal_setSize(size$1({ width: rightStubWidth, height: timeAxisSize.height }));
        }
    }
    _internal_optimalHeight() {
        const rendererOptions = this._private__getRendererOptions();
        return Math.ceil(
        // rendererOptions.offsetSize +
        rendererOptions._internal_borderSize +
            rendererOptions._internal_tickLength +
            rendererOptions._internal_fontSize +
            rendererOptions._internal_paddingTop +
            rendererOptions._internal_paddingBottom +
            rendererOptions._internal_labelBottomOffset);
    }
    _internal_update() {
        // this call has side-effect - it regenerates marks on the time scale
        this._private__chart._internal_model()._internal_timeScale()._internal_marks();
    }
    _internal_getBitmapSize() {
        return this._private__canvasBinding.bitmapSize;
    }
    _internal_drawBitmap(ctx, x, y) {
        const bitmapSize = this._internal_getBitmapSize();
        if (bitmapSize.width > 0 && bitmapSize.height > 0) {
            ctx.drawImage(this._private__canvasBinding.canvasElement, x, y);
        }
    }
    _internal_paint(type) {
        if (type === 0 /* InvalidationLevel.None */) {
            return;
        }
        const canvasOptions = {
            colorSpace: this._private__options.colorSpace,
        };
        if (type !== 1 /* InvalidationLevel.Cursor */) {
            this._private__canvasBinding.applySuggestedBitmapSize();
            const target = tryCreateCanvasRenderingTarget2D(this._private__canvasBinding, canvasOptions);
            if (target !== null) {
                target.useBitmapCoordinateSpace((scope) => {
                    this._private__drawBackground(scope);
                    this._private__drawBorder(scope);
                    this._private__drawAdditionalSources(target, sourceBottomPaneViews);
                });
                this._private__drawTickMarks(target);
                this._private__drawAdditionalSources(target, sourcePaneViews);
                // atm we don't have sources to be drawn on time axis except crosshair which is rendered on top level canvas
                // so let's don't call this code at all for now
                // this._drawLabels(this._chart.model().dataSources(), target);
            }
            if (this._private__leftStub !== null) {
                this._private__leftStub._internal_paint(type);
            }
            if (this._private__rightStub !== null) {
                this._private__rightStub._internal_paint(type);
            }
        }
        this._private__topCanvasBinding.applySuggestedBitmapSize();
        const topTarget = tryCreateCanvasRenderingTarget2D(this._private__topCanvasBinding, canvasOptions);
        if (topTarget !== null) {
            topTarget.useBitmapCoordinateSpace(({ context: ctx, bitmapSize }) => {
                ctx.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
            });
            this._private__drawLabels([...this._private__chart._internal_model()._internal_serieses(), this._private__chart._internal_model()._internal_crosshairSource()], topTarget);
            this._private__drawAdditionalSources(topTarget, sourceTopPaneViews);
        }
    }
    _private__drawAdditionalSources(target, axisViewsGetter) {
        const sources = this._private__chart._internal_model()._internal_serieses();
        for (const source of sources) {
            drawSourceViews(axisViewsGetter, (renderer) => drawBackground(renderer, target, false, undefined), source, undefined);
        }
        for (const source of sources) {
            drawSourceViews(axisViewsGetter, (renderer) => drawForeground(renderer, target, false, undefined), source, undefined);
        }
    }
    _private__drawBackground({ context: ctx, bitmapSize }) {
        clearRect(ctx, 0, 0, bitmapSize.width, bitmapSize.height, this._private__chart._internal_model()._internal_backgroundBottomColor());
    }
    _private__drawBorder({ context: ctx, bitmapSize, verticalPixelRatio }) {
        if (this._private__chart._internal_options().timeScale.borderVisible) {
            ctx.fillStyle = this._private__lineColor();
            const borderSize = Math.max(1, Math.floor(this._private__getRendererOptions()._internal_borderSize * verticalPixelRatio));
            ctx.fillRect(0, 0, bitmapSize.width, borderSize);
        }
    }
    _private__drawTickMarks(target) {
        const timeScale = this._private__chart._internal_model()._internal_timeScale();
        const tickMarks = timeScale._internal_marks();
        if (!tickMarks || tickMarks.length === 0) {
            return;
        }
        const maxWeight = this._private__horzScaleBehavior.maxTickMarkWeight(tickMarks);
        const rendererOptions = this._private__getRendererOptions();
        const options = timeScale._internal_options();
        if (options.borderVisible && options.ticksVisible) {
            target.useBitmapCoordinateSpace(({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) => {
                ctx.strokeStyle = this._private__lineColor();
                ctx.fillStyle = this._private__lineColor();
                const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
                const tickOffset = Math.floor(horizontalPixelRatio * 0.5);
                ctx.beginPath();
                const tickLen = Math.round(rendererOptions._internal_tickLength * verticalPixelRatio);
                for (let index = tickMarks.length; index--;) {
                    const x = Math.round(tickMarks[index].coord * horizontalPixelRatio);
                    ctx.rect(x - tickOffset, 0, tickWidth, tickLen);
                }
                ctx.fill();
            });
        }
        target.useMediaCoordinateSpace(({ context: ctx }) => {
            const yText = (rendererOptions._internal_borderSize +
                rendererOptions._internal_tickLength +
                rendererOptions._internal_paddingTop +
                rendererOptions._internal_fontSize / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this._private__textColor();
            // draw base marks
            ctx.font = this._private__baseFont();
            for (const tickMark of tickMarks) {
                if (tickMark.weight < maxWeight) {
                    const coordinate = tickMark.needAlignCoordinate ? this._private__alignTickMarkLabelCoordinate(ctx, tickMark.coord, tickMark.label) : tickMark.coord;
                    ctx.fillText(tickMark.label, coordinate, yText);
                }
            }
            if (this._private__chart._internal_options().timeScale.allowBoldLabels) {
                ctx.font = this._private__baseBoldFont();
            }
            for (const tickMark of tickMarks) {
                if (tickMark.weight >= maxWeight) {
                    const coordinate = tickMark.needAlignCoordinate ? this._private__alignTickMarkLabelCoordinate(ctx, tickMark.coord, tickMark.label) : tickMark.coord;
                    ctx.fillText(tickMark.label, coordinate, yText);
                }
            }
        });
    }
    _private__alignTickMarkLabelCoordinate(ctx, coordinate, labelText) {
        const labelWidth = this._private__widthCache._internal_measureText(ctx, labelText);
        const labelWidthHalf = labelWidth / 2;
        const leftTextCoordinate = Math.floor(coordinate - labelWidthHalf) + 0.5;
        if (leftTextCoordinate < 0) {
            coordinate = coordinate + Math.abs(0 - leftTextCoordinate);
        }
        else if (leftTextCoordinate + labelWidth > this._private__size.width) {
            coordinate = coordinate - Math.abs(this._private__size.width - (leftTextCoordinate + labelWidth));
        }
        return coordinate;
    }
    _private__drawLabels(sources, target) {
        const rendererOptions = this._private__getRendererOptions();
        for (const source of sources) {
            for (const view of source._internal_timeAxisViews()) {
                view._internal_renderer()._internal_draw(target, rendererOptions);
            }
        }
    }
    _private__lineColor() {
        return this._private__chart._internal_options().timeScale.borderColor;
    }
    _private__textColor() {
        return this._private__options.textColor;
    }
    _private__fontSize() {
        return this._private__options.fontSize;
    }
    _private__baseFont() {
        return makeFont(this._private__fontSize(), this._private__options.fontFamily);
    }
    _private__baseBoldFont() {
        return makeFont(this._private__fontSize(), this._private__options.fontFamily, 'bold');
    }
    _private__getRendererOptions() {
        if (this._private__rendererOptions === null) {
            this._private__rendererOptions = {
                _internal_borderSize: 1 /* Constants.BorderSize */,
                _internal_baselineOffset: NaN,
                _internal_paddingTop: NaN,
                _internal_paddingBottom: NaN,
                _internal_paddingHorizontal: NaN,
                _internal_tickLength: 5 /* Constants.TickLength */,
                _internal_fontSize: NaN,
                _internal_font: '',
                _internal_widthCache: new TextWidthCache(),
                _internal_labelBottomOffset: 0,
            };
        }
        const rendererOptions = this._private__rendererOptions;
        const newFont = this._private__baseFont();
        if (rendererOptions._internal_font !== newFont) {
            const fontSize = this._private__fontSize();
            rendererOptions._internal_fontSize = fontSize;
            rendererOptions._internal_font = newFont;
            rendererOptions._internal_paddingTop = 3 * fontSize / 12;
            rendererOptions._internal_paddingBottom = 3 * fontSize / 12;
            rendererOptions._internal_paddingHorizontal = 9 * fontSize / 12;
            rendererOptions._internal_baselineOffset = 0;
            rendererOptions._internal_labelBottomOffset = 4 * fontSize / 12;
            rendererOptions._internal_widthCache._internal_reset();
        }
        return this._private__rendererOptions;
    }
    _private__setCursor(type) {
        this._private__cell.style.cursor = type === 1 /* CursorType.EwResize */ ? 'ew-resize' : 'default';
    }
    _private__recreateStubs() {
        const model = this._private__chart._internal_model();
        const options = model._internal_options();
        if (!options.leftPriceScale.visible && this._private__leftStub !== null) {
            this._private__leftStubCell.removeChild(this._private__leftStub._internal_getElement());
            this._private__leftStub._internal_destroy();
            this._private__leftStub = null;
        }
        if (!options.rightPriceScale.visible && this._private__rightStub !== null) {
            this._private__rightStubCell.removeChild(this._private__rightStub._internal_getElement());
            this._private__rightStub._internal_destroy();
            this._private__rightStub = null;
        }
        const rendererOptionsProvider = this._private__chart._internal_model()._internal_rendererOptionsProvider();
        const params = {
            _internal_rendererOptionsProvider: rendererOptionsProvider,
        };
        const borderVisibleGetter = () => {
            return options.leftPriceScale.borderVisible && model._internal_timeScale()._internal_options().borderVisible;
        };
        const bottomColorGetter = () => model._internal_backgroundBottomColor();
        if (options.leftPriceScale.visible && this._private__leftStub === null) {
            this._private__leftStub = new PriceAxisStub('left', options, params, borderVisibleGetter, bottomColorGetter);
            this._private__leftStubCell.appendChild(this._private__leftStub._internal_getElement());
        }
        if (options.rightPriceScale.visible && this._private__rightStub === null) {
            this._private__rightStub = new PriceAxisStub('right', options, params, borderVisibleGetter, bottomColorGetter);
            this._private__rightStubCell.appendChild(this._private__rightStub._internal_getElement());
        }
    }
}

const windowsChrome = isChromiumBased() && isWindows();
class ChartWidget {
    constructor(container, options, horzScaleBehavior) {
        this._private__paneWidgets = [];
        this._private__paneSeparators = [];
        this._private__drawRafId = 0;
        this._private__height = 0;
        this._private__width = 0;
        this._private__leftPriceAxisWidth = 0;
        this._private__rightPriceAxisWidth = 0;
        this._private__invalidateMask = null;
        this._private__drawPlanned = false;
        this._private__clicked = new Delegate();
        this._private__dblClicked = new Delegate();
        this._private__crosshairMoved = new Delegate();
        this._private__observer = null;
        this._private__cursorStyleOverride = null;
        this._private__container = container;
        this._private__options = options;
        this._private__horzScaleBehavior = horzScaleBehavior;
        this._private__element = document.createElement('div');
        this._private__element.classList.add('tv-lightweight-charts');
        this._private__element.style.overflow = 'hidden';
        this._private__element.style.direction = 'ltr';
        this._private__element.style.width = '100%';
        this._private__element.style.height = '100%';
        disableSelection(this._private__element);
        this._private__tableElement = document.createElement('table');
        this._private__tableElement.setAttribute('cellspacing', '0');
        this._private__element.appendChild(this._private__tableElement);
        this._private__onWheelBound = this._private__onMousewheel.bind(this);
        if (shouldSubscribeMouseWheel(this._private__options)) {
            this._private__setMouseWheelEventListener(true);
        }
        this._private__model = new ChartModel(this._private__invalidateHandler.bind(this), this._private__options, horzScaleBehavior);
        this._internal_model()._internal_crosshairMoved()._internal_subscribe(this._private__onPaneWidgetCrosshairMoved.bind(this), this);
        this._private__timeAxisWidget = new TimeAxisWidget(this, this._private__horzScaleBehavior);
        this._private__tableElement.appendChild(this._private__timeAxisWidget._internal_getElement());
        const usedObserver = options.autoSize && this._private__installObserver();
        // observer could not fire event immediately for some cases
        // so we have to set initial size manually
        let width = this._private__options.width;
        let height = this._private__options.height;
        // ignore width/height options if observer has actually been used
        // however respect options if installing resize observer failed
        if (usedObserver || width === 0 || height === 0) {
            const containerRect = container.getBoundingClientRect();
            width = width || containerRect.width;
            height = height || containerRect.height;
        }
        // BEWARE: resize must be called BEFORE _syncGuiWithModel (in constructor only)
        // or after but with adjustSize to properly update time scale
        this._internal_resize(width, height);
        this._private__syncGuiWithModel();
        container.appendChild(this._private__element);
        this._private__updateTimeAxisVisibility();
        this._private__model._internal_timeScale()._internal_optionsApplied()._internal_subscribe(this._private__model._internal_fullUpdate.bind(this._private__model), this);
        this._private__model._internal_priceScalesOptionsChanged()._internal_subscribe(this._private__model._internal_fullUpdate.bind(this._private__model), this);
    }
    _internal_model() {
        return this._private__model;
    }
    _internal_options() {
        return this._private__options;
    }
    _internal_paneWidgets() {
        return this._private__paneWidgets;
    }
    _internal_timeAxisWidget() {
        return this._private__timeAxisWidget;
    }
    _internal_destroy() {
        this._private__setMouseWheelEventListener(false);
        if (this._private__drawRafId !== 0) {
            window.cancelAnimationFrame(this._private__drawRafId);
        }
        this._private__model._internal_crosshairMoved()._internal_unsubscribeAll(this);
        this._private__model._internal_timeScale()._internal_optionsApplied()._internal_unsubscribeAll(this);
        this._private__model._internal_priceScalesOptionsChanged()._internal_unsubscribeAll(this);
        this._private__model._internal_destroy();
        for (const paneWidget of this._private__paneWidgets) {
            this._private__tableElement.removeChild(paneWidget._internal_getElement());
            paneWidget._internal_clicked()._internal_unsubscribeAll(this);
            paneWidget._internal_dblClicked()._internal_unsubscribeAll(this);
            paneWidget._internal_destroy();
        }
        this._private__paneWidgets = [];
        for (const paneSeparator of this._private__paneSeparators) {
            this._private__destroySeparator(paneSeparator);
        }
        this._private__paneSeparators = [];
        ensureNotNull(this._private__timeAxisWidget)._internal_destroy();
        if (this._private__element.parentElement !== null) {
            this._private__element.parentElement.removeChild(this._private__element);
        }
        this._private__crosshairMoved._internal_destroy();
        this._private__clicked._internal_destroy();
        this._private__dblClicked._internal_destroy();
        this._private__uninstallObserver();
    }
    _internal_resize(width, height, forceRepaint = false) {
        if (this._private__height === height && this._private__width === width) {
            return;
        }
        const sizeHint = suggestChartSize(size$1({ width, height }));
        this._private__height = sizeHint.height;
        this._private__width = sizeHint.width;
        const heightStr = this._private__height + 'px';
        const widthStr = this._private__width + 'px';
        ensureNotNull(this._private__element).style.height = heightStr;
        ensureNotNull(this._private__element).style.width = widthStr;
        this._private__tableElement.style.height = heightStr;
        this._private__tableElement.style.width = widthStr;
        if (forceRepaint) {
            this._private__drawImpl(InvalidateMask._internal_full(), performance.now());
        }
        else {
            this._private__model._internal_fullUpdate();
        }
    }
    _internal_paint(invalidateMask) {
        if (invalidateMask === undefined) {
            invalidateMask = InvalidateMask._internal_full();
        }
        for (let i = 0; i < this._private__paneWidgets.length; i++) {
            this._private__paneWidgets[i]._internal_paint(invalidateMask._internal_invalidateForPane(i)._internal_level);
        }
        if (this._private__options.timeScale.visible) {
            this._private__timeAxisWidget._internal_paint(invalidateMask._internal_fullInvalidation());
        }
    }
    _internal_applyOptions(options) {
        const currentlyHasMouseWheelListener = shouldSubscribeMouseWheel(this._private__options);
        // we don't need to merge options here because it's done in chart model
        // and since both model and widget share the same object it will be done automatically for widget as well
        // not ideal solution for sure, but it work's for now ¯\_(ツ)_/¯
        this._private__model._internal_applyOptions(options);
        const shouldHaveMouseWheelListener = shouldSubscribeMouseWheel(this._private__options);
        if (shouldHaveMouseWheelListener !== currentlyHasMouseWheelListener) {
            this._private__setMouseWheelEventListener(shouldHaveMouseWheelListener);
        }
        if (options['layout']?.panes) {
            this._private__applyPanesOptions();
        }
        this._private__updateTimeAxisVisibility();
        this._private__applyAutoSizeOptions(options);
    }
    _internal_clicked() {
        return this._private__clicked;
    }
    _internal_dblClicked() {
        return this._private__dblClicked;
    }
    _internal_crosshairMoved() {
        return this._private__crosshairMoved;
    }
    _internal_takeScreenshot() {
        if (this._private__invalidateMask !== null) {
            this._private__drawImpl(this._private__invalidateMask, performance.now());
            this._private__invalidateMask = null;
        }
        const screeshotBitmapSize = this._private__traverseLayout(null);
        const screenshotCanvas = document.createElement('canvas');
        screenshotCanvas.width = screeshotBitmapSize.width;
        screenshotCanvas.height = screeshotBitmapSize.height;
        const ctx = ensureNotNull(screenshotCanvas.getContext('2d'));
        this._private__traverseLayout(ctx);
        return screenshotCanvas;
    }
    _internal_getPriceAxisWidth(position) {
        if (position === "left" /* DefaultPriceScaleId.Left */ && !this._private__isLeftAxisVisible()) {
            return 0;
        }
        if (position === "right" /* DefaultPriceScaleId.Right */ && !this._private__isRightAxisVisible()) {
            return 0;
        }
        if (this._private__paneWidgets.length === 0) {
            return 0;
        }
        // we don't need to worry about exactly pane widget here
        // because all pane widgets have the same width of price axis widget
        // see _adjustSizeImpl
        const priceAxisWidget = position === "left" /* DefaultPriceScaleId.Left */
            ? this._private__paneWidgets[0]._internal_leftPriceAxisWidget()
            : this._private__paneWidgets[0]._internal_rightPriceAxisWidget();
        return ensureNotNull(priceAxisWidget)._internal_getWidth();
    }
    _internal_autoSizeActive() {
        return this._private__options.autoSize && this._private__observer !== null;
    }
    _internal_element() {
        return this._private__element;
    }
    _internal_setCursorStyle(style) {
        this._private__cursorStyleOverride = style;
        if (this._private__cursorStyleOverride) {
            this._internal_element().style.setProperty('cursor', style);
        }
        else {
            this._internal_element().style.removeProperty('cursor');
        }
    }
    _internal_getCursorOverrideStyle() {
        return this._private__cursorStyleOverride;
    }
    _internal_paneSize(paneIndex) {
        return ensureDefined(this._private__paneWidgets[paneIndex])._internal_getSize();
    }
    _private__applyPanesOptions() {
        this._private__paneSeparators.forEach((separator) => {
            separator._internal_update();
        });
    }
    // eslint-disable-next-line complexity
    _private__applyAutoSizeOptions(options) {
        if (options.autoSize === undefined && this._private__observer && (options.width !== undefined || options.height !== undefined)) {
            warn(`You should turn autoSize off explicitly before specifying sizes; try adding options.autoSize: false to new options`);
            return;
        }
        if (options.autoSize && !this._private__observer) {
            // installing observer will override resize if successful
            this._private__installObserver();
        }
        if (options.autoSize === false && this._private__observer !== null) {
            this._private__uninstallObserver();
        }
        if (!options.autoSize && (options.width !== undefined || options.height !== undefined)) {
            this._internal_resize(options.width || this._private__width, options.height || this._private__height);
        }
    }
    /**
     * Traverses the widget's layout (pane and axis child widgets),
     * draws the screenshot (if rendering context is passed) and returns the screenshot bitmap size
     *
     * @param ctx - if passed, used to draw the screenshot of widget
     * @returns screenshot bitmap size
     */
    _private__traverseLayout(ctx) {
        let totalWidth = 0;
        let totalHeight = 0;
        const firstPane = this._private__paneWidgets[0];
        const drawPriceAxises = (position, targetX) => {
            let targetY = 0;
            for (let paneIndex = 0; paneIndex < this._private__paneWidgets.length; paneIndex++) {
                const paneWidget = this._private__paneWidgets[paneIndex];
                const priceAxisWidget = ensureNotNull(position === 'left' ? paneWidget._internal_leftPriceAxisWidget() : paneWidget._internal_rightPriceAxisWidget());
                const bitmapSize = priceAxisWidget._internal_getBitmapSize();
                if (ctx !== null) {
                    priceAxisWidget._internal_drawBitmap(ctx, targetX, targetY);
                }
                targetY += bitmapSize.height;
                if (paneIndex < this._private__paneWidgets.length - 1) {
                    const separator = this._private__paneSeparators[paneIndex];
                    const separatorBitmapSize = separator._internal_getBitmapSize();
                    if (ctx !== null) {
                        separator._internal_drawBitmap(ctx, targetX, targetY);
                    }
                    targetY += separatorBitmapSize.height;
                }
            }
        };
        // draw left price scale if exists
        if (this._private__isLeftAxisVisible()) {
            drawPriceAxises('left', 0);
            const leftAxisBitmapWidth = ensureNotNull(firstPane._internal_leftPriceAxisWidget())._internal_getBitmapSize().width;
            totalWidth += leftAxisBitmapWidth;
        }
        for (let paneIndex = 0; paneIndex < this._private__paneWidgets.length; paneIndex++) {
            const paneWidget = this._private__paneWidgets[paneIndex];
            const bitmapSize = paneWidget._internal_getBitmapSize();
            if (ctx !== null) {
                paneWidget._internal_drawBitmap(ctx, totalWidth, totalHeight);
            }
            totalHeight += bitmapSize.height;
            if (paneIndex < this._private__paneWidgets.length - 1) {
                const separator = this._private__paneSeparators[paneIndex];
                const separatorBitmapSize = separator._internal_getBitmapSize();
                if (ctx !== null) {
                    separator._internal_drawBitmap(ctx, totalWidth, totalHeight);
                }
                totalHeight += separatorBitmapSize.height;
            }
        }
        const firstPaneBitmapWidth = firstPane._internal_getBitmapSize().width;
        totalWidth += firstPaneBitmapWidth;
        // draw right price scale if exists
        if (this._private__isRightAxisVisible()) {
            drawPriceAxises('right', totalWidth);
            const rightAxisBitmapWidth = ensureNotNull(firstPane._internal_rightPriceAxisWidget())._internal_getBitmapSize().width;
            totalWidth += rightAxisBitmapWidth;
        }
        const drawStub = (position, targetX, targetY) => {
            const stub = ensureNotNull(position === 'left' ? this._private__timeAxisWidget._internal_leftStub() : this._private__timeAxisWidget._internal_rightStub());
            stub._internal_drawBitmap(ensureNotNull(ctx), targetX, targetY);
        };
        // draw time scale and stubs
        if (this._private__options.timeScale.visible) {
            const timeAxisBitmapSize = this._private__timeAxisWidget._internal_getBitmapSize();
            if (ctx !== null) {
                let targetX = 0;
                if (this._private__isLeftAxisVisible()) {
                    drawStub('left', targetX, totalHeight);
                    targetX = ensureNotNull(firstPane._internal_leftPriceAxisWidget())._internal_getBitmapSize().width;
                }
                this._private__timeAxisWidget._internal_drawBitmap(ctx, targetX, totalHeight);
                targetX += timeAxisBitmapSize.width;
                if (this._private__isRightAxisVisible()) {
                    drawStub('right', targetX, totalHeight);
                }
            }
            totalHeight += timeAxisBitmapSize.height;
        }
        return size$1({
            width: totalWidth,
            height: totalHeight,
        });
    }
    // eslint-disable-next-line complexity
    _private__adjustSizeImpl() {
        let totalStretch = 0;
        let leftPriceAxisWidth = 0;
        let rightPriceAxisWidth = 0;
        for (const paneWidget of this._private__paneWidgets) {
            if (this._private__isLeftAxisVisible()) {
                leftPriceAxisWidth = Math.max(leftPriceAxisWidth, ensureNotNull(paneWidget._internal_leftPriceAxisWidget())._internal_optimalWidth(), this._private__options.leftPriceScale.minimumWidth);
            }
            if (this._private__isRightAxisVisible()) {
                rightPriceAxisWidth = Math.max(rightPriceAxisWidth, ensureNotNull(paneWidget._internal_rightPriceAxisWidget())._internal_optimalWidth(), this._private__options.rightPriceScale.minimumWidth);
            }
            totalStretch += paneWidget._internal_stretchFactor();
        }
        leftPriceAxisWidth = suggestPriceScaleWidth(leftPriceAxisWidth);
        rightPriceAxisWidth = suggestPriceScaleWidth(rightPriceAxisWidth);
        const width = this._private__width;
        const height = this._private__height;
        const paneWidth = Math.max(width - leftPriceAxisWidth - rightPriceAxisWidth, 0);
        const separatorCount = this._private__paneSeparators.length;
        const separatorHeight = 1 /* SeparatorConstants.SeparatorHeight */;
        const separatorsHeight = separatorHeight * separatorCount;
        const timeAxisVisible = this._private__options.timeScale.visible;
        let timeAxisHeight = timeAxisVisible ? Math.max(this._private__timeAxisWidget._internal_optimalHeight(), this._private__options.timeScale.minimumHeight) : 0;
        timeAxisHeight = suggestTimeScaleHeight(timeAxisHeight);
        const otherWidgetHeight = separatorsHeight + timeAxisHeight;
        const totalPaneHeight = height < otherWidgetHeight ? 0 : height - otherWidgetHeight;
        const stretchPixels = totalPaneHeight / totalStretch;
        let accumulatedHeight = 0;
        const pixelRatio = window.devicePixelRatio || 1;
        for (let paneIndex = 0; paneIndex < this._private__paneWidgets.length; ++paneIndex) {
            const paneWidget = this._private__paneWidgets[paneIndex];
            paneWidget._internal_setState(this._private__model._internal_panes()[paneIndex]);
            let paneHeight = 0;
            let calculatePaneHeight = 0;
            if (paneIndex === this._private__paneWidgets.length - 1) {
                calculatePaneHeight = Math.ceil((totalPaneHeight - accumulatedHeight) * pixelRatio) / pixelRatio;
            }
            else {
                calculatePaneHeight = Math.round(paneWidget._internal_stretchFactor() * stretchPixels * pixelRatio) / pixelRatio;
            }
            paneHeight = Math.max(calculatePaneHeight, 2);
            accumulatedHeight += paneHeight;
            paneWidget._internal_setSize(size$1({ width: paneWidth, height: paneHeight }));
            if (this._private__isLeftAxisVisible()) {
                paneWidget._internal_setPriceAxisSize(leftPriceAxisWidth, 'left');
            }
            if (this._private__isRightAxisVisible()) {
                paneWidget._internal_setPriceAxisSize(rightPriceAxisWidth, 'right');
            }
            if (paneWidget._internal_state()) {
                this._private__model._internal_setPaneHeight(paneWidget._internal_state(), paneHeight);
            }
        }
        this._private__timeAxisWidget._internal_setSizes(size$1({ width: timeAxisVisible ? paneWidth : 0, height: timeAxisHeight }), timeAxisVisible ? leftPriceAxisWidth : 0, timeAxisVisible ? rightPriceAxisWidth : 0);
        this._private__model._internal_setWidth(paneWidth);
        if (this._private__leftPriceAxisWidth !== leftPriceAxisWidth) {
            this._private__leftPriceAxisWidth = leftPriceAxisWidth;
        }
        if (this._private__rightPriceAxisWidth !== rightPriceAxisWidth) {
            this._private__rightPriceAxisWidth = rightPriceAxisWidth;
        }
    }
    _private__setMouseWheelEventListener(add) {
        if (add) {
            this._private__element.addEventListener('wheel', this._private__onWheelBound, { passive: false });
            return;
        }
        this._private__element.removeEventListener('wheel', this._private__onWheelBound);
    }
    _private__determineWheelSpeedAdjustment(event) {
        switch (event.deltaMode) {
            case event.DOM_DELTA_PAGE:
                // one screen at time scroll mode
                return 120;
            case event.DOM_DELTA_LINE:
                // one line at time scroll mode
                return 32;
        }
        if (!windowsChrome) {
            return 1;
        }
        // Chromium on Windows has a bug where the scroll speed isn't correctly
        // adjusted for high density displays. We need to correct for this so that
        // scroll speed is consistent between browsers.
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1001735
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1207308
        return (1 / window.devicePixelRatio);
    }
    _private__onMousewheel(event) {
        if ((event.deltaX === 0 || !this._private__options['handleScroll'].mouseWheel) &&
            (event.deltaY === 0 || !this._private__options['handleScale'].mouseWheel)) {
            return;
        }
        const scrollSpeedAdjustment = this._private__determineWheelSpeedAdjustment(event);
        const deltaX = scrollSpeedAdjustment * event.deltaX / 100;
        const deltaY = -(scrollSpeedAdjustment * event.deltaY / 100);
        if (event.cancelable) {
            event.preventDefault();
        }
        if (deltaY !== 0 && this._private__options['handleScale'].mouseWheel) {
            const zoomScale = Math.sign(deltaY) * Math.min(1, Math.abs(deltaY));
            const scrollPosition = event.clientX - this._private__element.getBoundingClientRect().left;
            this._internal_model()._internal_zoomTime(scrollPosition, zoomScale);
        }
        if (deltaX !== 0 && this._private__options['handleScroll'].mouseWheel) {
            this._internal_model()._internal_scrollChart(deltaX * -80); // 80 is a made up coefficient, and minus is for the "natural" scroll
        }
    }
    _private__drawImpl(invalidateMask, time) {
        const invalidationType = invalidateMask._internal_fullInvalidation();
        // actions for full invalidation ONLY (not shared with light)
        if (invalidationType === 3 /* InvalidationLevel.Full */) {
            this._private__updateGui();
        }
        // light or full invalidate actions
        if (invalidationType === 3 /* InvalidationLevel.Full */ ||
            invalidationType === 2 /* InvalidationLevel.Light */) {
            this._private__applyMomentaryAutoScale(invalidateMask);
            this._private__applyTimeScaleInvalidations(invalidateMask, time);
            this._private__timeAxisWidget._internal_update();
            this._private__paneWidgets.forEach((pane) => {
                pane._internal_updatePriceAxisWidgets();
            });
            // In the case a full invalidation has been postponed during the draw, reapply
            // the timescale invalidations. A full invalidation would mean there is a change
            // in the timescale width (caused by price scale changes) that needs to be drawn
            // right away to avoid flickering.
            if (this._private__invalidateMask?._internal_fullInvalidation() === 3 /* InvalidationLevel.Full */) {
                this._private__invalidateMask._internal_merge(invalidateMask);
                this._private__updateGui();
                this._private__applyMomentaryAutoScale(this._private__invalidateMask);
                this._private__applyTimeScaleInvalidations(this._private__invalidateMask, time);
                invalidateMask = this._private__invalidateMask;
                this._private__invalidateMask = null;
            }
        }
        this._internal_paint(invalidateMask);
    }
    _private__applyTimeScaleInvalidations(invalidateMask, time) {
        for (const tsInvalidation of invalidateMask._internal_timeScaleInvalidations()) {
            this._private__applyTimeScaleInvalidation(tsInvalidation, time);
        }
    }
    _private__applyMomentaryAutoScale(invalidateMask) {
        const panes = this._private__model._internal_panes();
        for (let i = 0; i < panes.length; i++) {
            if (invalidateMask._internal_invalidateForPane(i)._internal_autoScale) {
                panes[i]._internal_momentaryAutoScale();
            }
        }
    }
    _private__applyTimeScaleInvalidation(invalidation, time) {
        const timeScale = this._private__model._internal_timeScale();
        switch (invalidation._internal_type) {
            case 0 /* TimeScaleInvalidationType.FitContent */:
                timeScale._internal_fitContent();
                break;
            case 1 /* TimeScaleInvalidationType.ApplyRange */:
                timeScale._internal_setLogicalRange(invalidation._internal_value);
                break;
            case 2 /* TimeScaleInvalidationType.ApplyBarSpacing */:
                timeScale._internal_setBarSpacing(invalidation._internal_value);
                break;
            case 3 /* TimeScaleInvalidationType.ApplyRightOffset */:
                timeScale._internal_setRightOffset(invalidation._internal_value);
                break;
            case 4 /* TimeScaleInvalidationType.Reset */:
                timeScale._internal_restoreDefault();
                break;
            case 5 /* TimeScaleInvalidationType.Animation */:
                if (!invalidation._internal_value._internal_finished(time)) {
                    timeScale._internal_setRightOffset(invalidation._internal_value._internal_getPosition(time));
                }
                break;
        }
    }
    _private__invalidateHandler(invalidateMask) {
        if (this._private__invalidateMask !== null) {
            this._private__invalidateMask._internal_merge(invalidateMask);
        }
        else {
            this._private__invalidateMask = invalidateMask;
        }
        if (!this._private__drawPlanned) {
            this._private__drawPlanned = true;
            this._private__drawRafId = window.requestAnimationFrame((time) => {
                this._private__drawPlanned = false;
                this._private__drawRafId = 0;
                if (this._private__invalidateMask !== null) {
                    const mask = this._private__invalidateMask;
                    this._private__invalidateMask = null;
                    this._private__drawImpl(mask, time);
                    for (const tsInvalidation of mask._internal_timeScaleInvalidations()) {
                        if (tsInvalidation._internal_type === 5 /* TimeScaleInvalidationType.Animation */ && !tsInvalidation._internal_value._internal_finished(time)) {
                            this._internal_model()._internal_setTimeScaleAnimation(tsInvalidation._internal_value);
                            break;
                        }
                    }
                }
            });
        }
    }
    _private__updateGui() {
        this._private__syncGuiWithModel();
    }
    _private__destroySeparator(separator) {
        this._private__tableElement.removeChild(separator._internal_getElement());
        separator._internal_destroy();
    }
    _private__syncGuiWithModel() {
        const panes = this._private__model._internal_panes();
        const targetPaneWidgetsCount = panes.length;
        const actualPaneWidgetsCount = this._private__paneWidgets.length;
        // Remove (if needed) pane widgets and separators
        for (let i = targetPaneWidgetsCount; i < actualPaneWidgetsCount; i++) {
            const paneWidget = ensureDefined(this._private__paneWidgets.pop());
            this._private__tableElement.removeChild(paneWidget._internal_getElement());
            paneWidget._internal_clicked()._internal_unsubscribeAll(this);
            paneWidget._internal_dblClicked()._internal_unsubscribeAll(this);
            paneWidget._internal_destroy();
            const paneSeparator = this._private__paneSeparators.pop();
            if (paneSeparator !== undefined) {
                this._private__destroySeparator(paneSeparator);
            }
        }
        // Create (if needed) new pane widgets and separators
        for (let i = actualPaneWidgetsCount; i < targetPaneWidgetsCount; i++) {
            const paneWidget = new PaneWidget(this, panes[i]);
            paneWidget._internal_clicked()._internal_subscribe(this._private__onPaneWidgetClicked.bind(this, paneWidget), this);
            paneWidget._internal_dblClicked()._internal_subscribe(this._private__onPaneWidgetDblClicked.bind(this, paneWidget), this);
            this._private__paneWidgets.push(paneWidget);
            // create and insert separator
            if (i > 0) {
                const paneSeparator = new PaneSeparator(this, i - 1, i);
                this._private__paneSeparators.push(paneSeparator);
                this._private__tableElement.insertBefore(paneSeparator._internal_getElement(), this._private__timeAxisWidget._internal_getElement());
            }
            // insert paneWidget
            this._private__tableElement.insertBefore(paneWidget._internal_getElement(), this._private__timeAxisWidget._internal_getElement());
        }
        for (let i = 0; i < targetPaneWidgetsCount; i++) {
            const state = panes[i];
            const paneWidget = this._private__paneWidgets[i];
            if (paneWidget._internal_state() !== state) {
                paneWidget._internal_setState(state);
            }
            else {
                paneWidget._internal_updatePriceAxisWidgetsStates();
            }
        }
        this._private__updateTimeAxisVisibility();
        this._private__adjustSizeImpl();
    }
    _private__getMouseEventParamsImpl(index, point, event, pane) {
        const seriesData = new Map();
        if (index !== null) {
            const serieses = this._private__model._internal_serieses();
            serieses.forEach((s) => {
                // TODO: replace with search left
                const data = s._internal_bars()._internal_search(index);
                if (data !== null) {
                    seriesData.set(s, data);
                }
            });
        }
        let clientTime;
        if (index !== null) {
            const timePoint = this._private__model._internal_timeScale()._internal_indexToTimeScalePoint(index)?.originalTime;
            if (timePoint !== undefined) {
                clientTime = timePoint;
            }
        }
        const hoveredSource = this._internal_model()._internal_hoveredSource();
        const hoveredSeries = hoveredSource !== null && hoveredSource._internal_source instanceof Series
            ? hoveredSource._internal_source
            : undefined;
        const hoveredObject = hoveredSource !== null && hoveredSource._internal_object !== undefined
            ? hoveredSource._internal_object._internal_externalId
            : undefined;
        const paneIndex = this._private__getPaneIndex(pane);
        return {
            _internal_originalTime: clientTime,
            _internal_index: index ?? undefined,
            _internal_point: point ?? undefined,
            _internal_paneIndex: paneIndex !== -1 ? paneIndex : undefined,
            _internal_hoveredSeries: hoveredSeries,
            _internal_seriesData: seriesData,
            _internal_hoveredObject: hoveredObject,
            _internal_touchMouseEventData: event ?? undefined,
        };
    }
    _private__getPaneIndex(pane) {
        let paneIndex = -1;
        if (pane) {
            paneIndex = this._private__paneWidgets.indexOf(pane);
        }
        else {
            const crosshairPane = this._internal_model()._internal_crosshairSource()._internal_pane();
            if (crosshairPane !== null) {
                paneIndex = this._internal_model()._internal_panes().indexOf(crosshairPane);
            }
        }
        return paneIndex;
    }
    _private__onPaneWidgetClicked(pane, time, point, event) {
        this._private__clicked._internal_fire(() => this._private__getMouseEventParamsImpl(time, point, event, pane));
    }
    _private__onPaneWidgetDblClicked(pane, time, point, event) {
        this._private__dblClicked._internal_fire(() => this._private__getMouseEventParamsImpl(time, point, event, pane));
    }
    _private__onPaneWidgetCrosshairMoved(time, point, event) {
        this._internal_setCursorStyle(this._internal_model()._internal_hoveredSource()?._internal_cursorStyle ?? null);
        this._private__crosshairMoved._internal_fire(() => this._private__getMouseEventParamsImpl(time, point, event));
    }
    _private__updateTimeAxisVisibility() {
        const display = this._private__options.timeScale.visible ? '' : 'none';
        this._private__timeAxisWidget._internal_getElement().style.display = display;
    }
    _private__isLeftAxisVisible() {
        return this._private__paneWidgets[0]._internal_state()._internal_leftPriceScale()._internal_options().visible;
    }
    _private__isRightAxisVisible() {
        return this._private__paneWidgets[0]._internal_state()._internal_rightPriceScale()._internal_options().visible;
    }
    _private__installObserver() {
        // eslint-disable-next-line no-restricted-syntax
        if (!('ResizeObserver' in window)) {
            warn('Options contains "autoSize" flag, but the browser does not support ResizeObserver feature. Please provide polyfill.');
            return false;
        }
        else {
            this._private__observer = new ResizeObserver((entries) => {
                // There is no need to check if entry.target === this._container since there is only
                // a single element being observed.
                // and we want to use the last entry (if multiple) because it would be most up to date
                // (since the browser may batch multiple updates).
                const containerEntry = entries[entries.length - 1];
                if (!containerEntry) {
                    // this may be undefined if the entries array was empty.
                    return;
                }
                this._internal_resize(containerEntry.contentRect.width, containerEntry.contentRect.height);
            });
            this._private__observer.observe(this._private__container, { box: 'border-box' });
            return true;
        }
    }
    _private__uninstallObserver() {
        if (this._private__observer !== null) {
            this._private__observer.disconnect();
        }
        this._private__observer = null;
    }
}
function disableSelection(element) {
    element.style.userSelect = 'none';
    // eslint-disable-next-line deprecation/deprecation
    element.style.webkitUserSelect = 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    element.style.msUserSelect = 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    element.style.MozUserSelect = 'none';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    element.style.webkitTapHighlightColor = 'transparent';
}
function shouldSubscribeMouseWheel(options) {
    return Boolean(options['handleScroll'].mouseWheel || options['handleScale'].mouseWheel);
}

function isWhitespaceData(data) {
    return data.open === undefined && data.value === undefined;
}
function isFulfilledData(data) {
    return isFulfilledBarData(data) || isFulfilledLineData(data);
}
function isFulfilledBarData(data) {
    return data.open !== undefined;
}
function isFulfilledLineData(data) {
    return data.value !== undefined;
}

function getColoredLineBasedSeriesPlotRow(time, index, item, originalTime) {
    const val = item.value;
    const res = { _internal_index: index, _internal_time: time, _internal_value: [val, val, val, val], _internal_originalTime: originalTime };
    if (item.color !== undefined) {
        res._internal_color = item.color;
    }
    return res;
}
function getAreaSeriesPlotRow(time, index, item, originalTime) {
    const val = item.value;
    const res = { _internal_index: index, _internal_time: time, _internal_value: [val, val, val, val], _internal_originalTime: originalTime };
    if (item.lineColor !== undefined) {
        res._internal_lineColor = item.lineColor;
    }
    if (item.topColor !== undefined) {
        res._internal_topColor = item.topColor;
    }
    if (item.bottomColor !== undefined) {
        res._internal_bottomColor = item.bottomColor;
    }
    return res;
}
function getBaselineSeriesPlotRow(time, index, item, originalTime) {
    const val = item.value;
    const res = { _internal_index: index, _internal_time: time, _internal_value: [val, val, val, val], _internal_originalTime: originalTime };
    if (item.topLineColor !== undefined) {
        res._internal_topLineColor = item.topLineColor;
    }
    if (item.bottomLineColor !== undefined) {
        res._internal_bottomLineColor = item.bottomLineColor;
    }
    if (item.topFillColor1 !== undefined) {
        res._internal_topFillColor1 = item.topFillColor1;
    }
    if (item.topFillColor2 !== undefined) {
        res._internal_topFillColor2 = item.topFillColor2;
    }
    if (item.bottomFillColor1 !== undefined) {
        res._internal_bottomFillColor1 = item.bottomFillColor1;
    }
    if (item.bottomFillColor2 !== undefined) {
        res._internal_bottomFillColor2 = item.bottomFillColor2;
    }
    return res;
}
function getBarSeriesPlotRow(time, index, item, originalTime) {
    const res = { _internal_index: index, _internal_time: time, _internal_value: [item.open, item.high, item.low, item.close], _internal_originalTime: originalTime };
    if (item.color !== undefined) {
        res._internal_color = item.color;
    }
    return res;
}
function getCandlestickSeriesPlotRow(time, index, item, originalTime) {
    const res = { _internal_index: index, _internal_time: time, _internal_value: [item.open, item.high, item.low, item.close], _internal_originalTime: originalTime };
    if (item.color !== undefined) {
        res._internal_color = item.color;
    }
    if (item.borderColor !== undefined) {
        res._internal_borderColor = item.borderColor;
    }
    if (item.wickColor !== undefined) {
        res._internal_wickColor = item.wickColor;
    }
    return res;
}
function getCustomSeriesPlotRow(time, index, item, originalTime, dataToPlotRow) {
    const values = ensureDefined(dataToPlotRow)(item);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const last = values[values.length - 1];
    const value = [last, max, min, last];
    const { time: excludedTime, color, ...data } = item;
    return { _internal_index: index, _internal_time: time, _internal_value: value, _internal_originalTime: originalTime, _internal_data: data, _internal_color: color };
}
function isSeriesPlotRow(row) {
    return row._internal_value !== undefined;
}
function wrapCustomValues(plotRow, bar) {
    if (bar.customValues !== undefined) {
        plotRow._internal_customValues = bar.customValues;
    }
    return plotRow;
}
function isWhitespaceDataWithCustomCheck(bar, customIsWhitespace) {
    if (customIsWhitespace) {
        return customIsWhitespace(bar);
    }
    return isWhitespaceData(bar);
}
function wrapWhitespaceData(createPlotRowFn) {
    return (time, index, bar, originalTime, dataToPlotRow, customIsWhitespace) => {
        if (isWhitespaceDataWithCustomCheck(bar, customIsWhitespace)) {
            return wrapCustomValues({ _internal_time: time, _internal_index: index, _internal_originalTime: originalTime }, bar);
        }
        return wrapCustomValues(createPlotRowFn(time, index, bar, originalTime, dataToPlotRow), bar);
    };
}
function getSeriesPlotRowCreator(seriesType) {
    const seriesPlotRowFnMap = {
        Candlestick: wrapWhitespaceData(getCandlestickSeriesPlotRow),
        Bar: wrapWhitespaceData(getBarSeriesPlotRow),
        Area: wrapWhitespaceData(getAreaSeriesPlotRow),
        Baseline: wrapWhitespaceData(getBaselineSeriesPlotRow),
        Histogram: wrapWhitespaceData(getColoredLineBasedSeriesPlotRow),
        Line: wrapWhitespaceData(getColoredLineBasedSeriesPlotRow),
        Custom: wrapWhitespaceData(getCustomSeriesPlotRow),
    };
    return seriesPlotRowFnMap[seriesType];
}

/// <reference types="_build-time-constants" />
function createEmptyTimePointData(timePoint) {
    return { _internal_index: 0, _internal_mapping: new Map(), _internal_timePoint: timePoint };
}
function seriesRowsFirstAndLastTime(seriesRows, bh) {
    if (seriesRows === undefined || seriesRows.length === 0) {
        return undefined;
    }
    return {
        _internal_firstTime: bh.key(seriesRows[0]._internal_time),
        _internal_lastTime: bh.key(seriesRows[seriesRows.length - 1]._internal_time),
    };
}
function seriesUpdateInfo(seriesRows, prevSeriesRows, bh) {
    const firstAndLastTime = seriesRowsFirstAndLastTime(seriesRows, bh);
    const prevFirstAndLastTime = seriesRowsFirstAndLastTime(prevSeriesRows, bh);
    if (firstAndLastTime !== undefined && prevFirstAndLastTime !== undefined) {
        return {
            _internal_historicalUpdate: false,
            _internal_lastBarUpdatedOrNewBarsAddedToTheRight: firstAndLastTime._internal_lastTime >= prevFirstAndLastTime._internal_lastTime &&
                firstAndLastTime._internal_firstTime >= prevFirstAndLastTime._internal_firstTime,
        };
    }
    return undefined;
}
function timeScalePointTime(mergedPointData) {
    let result;
    mergedPointData.forEach((v) => {
        if (result === undefined) {
            result = v._internal_originalTime;
        }
    });
    return ensureDefined(result);
}
function saveOriginalTime(data) {
    if (data._internal_originalTime === undefined) {
        data._internal_originalTime = data.time;
    }
}
class DataLayer {
    constructor(horzScaleBehavior) {
        // note that _pointDataByTimePoint and _seriesRowsBySeries shares THE SAME objects in their values between each other
        // it's just different kind of maps to make usages/perf better
        this._private__pointDataByTimePoint = new Map();
        this._private__seriesRowsBySeries = new Map();
        this._private__seriesLastTimePoint = new Map();
        // this is kind of "dest" values (in opposite to "source" ones) - we don't need to modify it manually, the only by calling _updateTimeScalePoints or updateSeriesData methods
        this._private__sortedTimePoints = [];
        this._private__horzScaleBehavior = horzScaleBehavior;
    }
    _internal_destroy() {
        this._private__pointDataByTimePoint.clear();
        this._private__seriesRowsBySeries.clear();
        this._private__seriesLastTimePoint.clear();
        this._private__sortedTimePoints = [];
    }
    _internal_setSeriesData(series, data) {
        let needCleanupPoints = this._private__pointDataByTimePoint.size !== 0;
        let isTimeScaleAffected = false;
        // save previous series rows data before it's replaced inside this._setRowsToSeries
        const prevSeriesRows = this._private__seriesRowsBySeries.get(series);
        if (prevSeriesRows !== undefined) {
            if (this._private__seriesRowsBySeries.size === 1) {
                needCleanupPoints = false;
                isTimeScaleAffected = true;
                // perf optimization - if there is only 1 series, then we can just clear and fill everything from scratch
                this._private__pointDataByTimePoint.clear();
            }
            else {
                // perf optimization - actually we have to use this._pointDataByTimePoint for going through here
                // but as soon as this._sortedTimePoints is just a different form of _pointDataByTimePoint we can use it as well
                for (const point of this._private__sortedTimePoints) {
                    if (point.pointData._internal_mapping.delete(series)) {
                        isTimeScaleAffected = true;
                    }
                }
            }
        }
        let seriesRows = [];
        if (data.length !== 0) {
            const originalTimes = data.map((d) => d.time);
            const timeConverter = this._private__horzScaleBehavior.createConverterToInternalObj(data);
            const createPlotRow = getSeriesPlotRowCreator(series._internal_seriesType());
            const dataToPlotRow = series._internal_customSeriesPlotValuesBuilder();
            const customWhitespaceChecker = series._internal_customSeriesWhitespaceCheck();
            seriesRows = data.map((item, index) => {
                const time = timeConverter(item.time);
                const horzItemKey = this._private__horzScaleBehavior.key(time);
                let timePointData = this._private__pointDataByTimePoint.get(horzItemKey);
                if (timePointData === undefined) {
                    // the indexes will be sync later
                    timePointData = createEmptyTimePointData(time);
                    this._private__pointDataByTimePoint.set(horzItemKey, timePointData);
                    isTimeScaleAffected = true;
                }
                const row = createPlotRow(time, timePointData._internal_index, item, originalTimes[index], dataToPlotRow, customWhitespaceChecker);
                timePointData._internal_mapping.set(series, row);
                return row;
            });
        }
        if (needCleanupPoints) {
            // we deleted the old data from mapping and added the new ones
            // so there might be empty points now, let's remove them first
            this._private__cleanupPointsData();
        }
        this._private__setRowsToSeries(series, seriesRows);
        let firstChangedPointIndex = -1;
        if (isTimeScaleAffected) {
            // then generate the time scale points
            // timeWeight will be updates in _updateTimeScalePoints later
            const newTimeScalePoints = [];
            this._private__pointDataByTimePoint.forEach((pointData) => {
                newTimeScalePoints.push({
                    timeWeight: 0,
                    time: pointData._internal_timePoint,
                    pointData,
                    originalTime: timeScalePointTime(pointData._internal_mapping),
                });
            });
            newTimeScalePoints.sort((t1, t2) => this._private__horzScaleBehavior.key(t1.time) - this._private__horzScaleBehavior.key(t2.time));
            firstChangedPointIndex = this._private__replaceTimeScalePoints(newTimeScalePoints);
        }
        return this._private__getUpdateResponse(series, firstChangedPointIndex, seriesUpdateInfo(this._private__seriesRowsBySeries.get(series), prevSeriesRows, this._private__horzScaleBehavior));
    }
    _internal_removeSeries(series) {
        return this._internal_setSeriesData(series, []);
    }
    _internal_updateSeriesData(series, data, historicalUpdate) {
        const extendedData = data;
        saveOriginalTime(extendedData);
        // convertStringToBusinessDay(data);
        this._private__horzScaleBehavior.preprocessData(data);
        const timeConverter = this._private__horzScaleBehavior.createConverterToInternalObj([data]);
        const time = timeConverter(data.time);
        const lastSeriesTime = this._private__seriesLastTimePoint.get(series);
        if (!historicalUpdate && lastSeriesTime !== undefined && this._private__horzScaleBehavior.key(time) < this._private__horzScaleBehavior.key(lastSeriesTime)) {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            throw new Error(`Cannot update oldest data, last time=${lastSeriesTime}, new time=${time}`);
        }
        let pointDataAtTime = this._private__pointDataByTimePoint.get(this._private__horzScaleBehavior.key(time));
        if (historicalUpdate && pointDataAtTime === undefined) {
            throw new Error('Cannot update non-existing data point when historicalUpdate is true');
        }
        // if no point data found for the new data item
        // that means that we need to update scale
        const affectsTimeScale = pointDataAtTime === undefined;
        if (pointDataAtTime === undefined) {
            // the indexes will be sync later
            pointDataAtTime = createEmptyTimePointData(time);
            this._private__pointDataByTimePoint.set(this._private__horzScaleBehavior.key(time), pointDataAtTime);
        }
        const createPlotRow = getSeriesPlotRowCreator(series._internal_seriesType());
        const dataToPlotRow = series._internal_customSeriesPlotValuesBuilder();
        const customWhitespaceChecker = series._internal_customSeriesWhitespaceCheck();
        const plotRow = createPlotRow(time, pointDataAtTime._internal_index, data, extendedData._internal_originalTime, dataToPlotRow, customWhitespaceChecker);
        pointDataAtTime._internal_mapping.set(series, plotRow);
        if (historicalUpdate) {
            this._private__updateHistoricalSeriesRow(series, plotRow, pointDataAtTime._internal_index);
        }
        else {
            this._private__updateLastSeriesRow(series, plotRow);
        }
        const info = {
            _internal_lastBarUpdatedOrNewBarsAddedToTheRight: isSeriesPlotRow(plotRow),
            _internal_historicalUpdate: historicalUpdate,
        };
        // if point already exist on the time scale - we don't need to make a full update and just make an incremental one
        if (!affectsTimeScale) {
            return this._private__getUpdateResponse(series, -1, info);
        }
        const newPoint = {
            timeWeight: 0,
            time: pointDataAtTime._internal_timePoint,
            pointData: pointDataAtTime,
            originalTime: timeScalePointTime(pointDataAtTime._internal_mapping),
        };
        const insertIndex = lowerBound(this._private__sortedTimePoints, this._private__horzScaleBehavior.key(newPoint.time), (a, b) => this._private__horzScaleBehavior.key(a.time) < b);
        // yes, I know that this array is readonly and this change is intended to make it performative
        // we marked _sortedTimePoints array as readonly to avoid modifying this array anywhere else
        // but this place is exceptional case due performance reasons, sorry
        this._private__sortedTimePoints.splice(insertIndex, 0, newPoint);
        for (let index = insertIndex; index < this._private__sortedTimePoints.length; ++index) {
            assignIndexToPointData(this._private__sortedTimePoints[index].pointData, index);
        }
        this._private__horzScaleBehavior.fillWeightsForPoints(this._private__sortedTimePoints, insertIndex);
        return this._private__getUpdateResponse(series, insertIndex, info);
    }
    _private__updateLastSeriesRow(series, plotRow) {
        let seriesData = this._private__seriesRowsBySeries.get(series);
        if (seriesData === undefined) {
            seriesData = [];
            this._private__seriesRowsBySeries.set(series, seriesData);
        }
        const lastSeriesRow = seriesData.length !== 0 ? seriesData[seriesData.length - 1] : null;
        if (lastSeriesRow === null || this._private__horzScaleBehavior.key(plotRow._internal_time) > this._private__horzScaleBehavior.key(lastSeriesRow._internal_time)) {
            if (isSeriesPlotRow(plotRow)) {
                seriesData.push(plotRow);
            }
        }
        else {
            if (isSeriesPlotRow(plotRow)) {
                seriesData[seriesData.length - 1] = plotRow;
            }
            else {
                seriesData.splice(-1, 1);
            }
        }
        this._private__seriesLastTimePoint.set(series, plotRow._internal_time);
    }
    _private__updateHistoricalSeriesRow(series, plotRow, pointDataIndex) {
        const seriesData = this._private__seriesRowsBySeries.get(series);
        if (seriesData === undefined) {
            return;
        }
        // binary search for actual index in array.
        const index = lowerBound(seriesData, pointDataIndex, (row, currentIndex) => row._internal_index < currentIndex);
        if (isSeriesPlotRow(plotRow)) {
            seriesData[index] = plotRow;
        }
        else {
            seriesData.splice(index, 1);
        }
    }
    _private__setRowsToSeries(series, seriesRows) {
        if (seriesRows.length !== 0) {
            this._private__seriesRowsBySeries.set(series, seriesRows.filter(isSeriesPlotRow));
            this._private__seriesLastTimePoint.set(series, seriesRows[seriesRows.length - 1]._internal_time);
        }
        else {
            this._private__seriesRowsBySeries.delete(series);
            this._private__seriesLastTimePoint.delete(series);
        }
    }
    _private__cleanupPointsData() {
        // let's treat all current points as "potentially removed"
        // we could create an array with actually potentially removed points
        // but most likely this array will be similar to _sortedTimePoints so let's avoid using additional memory
        // note that we can use _sortedTimePoints here since a point might be removed only it was here previously
        for (const point of this._private__sortedTimePoints) {
            if (point.pointData._internal_mapping.size === 0) {
                this._private__pointDataByTimePoint.delete(this._private__horzScaleBehavior.key(point.time));
            }
        }
    }
    /**
     * Sets new time scale and make indexes valid for all series
     *
     * @returns The index of the first changed point or `-1` if there is no change.
     */
    _private__replaceTimeScalePoints(newTimePoints) {
        let firstChangedPointIndex = -1;
        // search the first different point and "syncing" time weight by the way
        for (let index = 0; index < this._private__sortedTimePoints.length && index < newTimePoints.length; ++index) {
            const oldPoint = this._private__sortedTimePoints[index];
            const newPoint = newTimePoints[index];
            if (this._private__horzScaleBehavior.key(oldPoint.time) !== this._private__horzScaleBehavior.key(newPoint.time)) {
                firstChangedPointIndex = index;
                break;
            }
            // re-assign point's time weight for points if time is the same (and all prior times was the same)
            newPoint.timeWeight = oldPoint.timeWeight;
            assignIndexToPointData(newPoint.pointData, index);
        }
        if (firstChangedPointIndex === -1 && this._private__sortedTimePoints.length !== newTimePoints.length) {
            // the common part of the prev and the new points are the same
            // so the first changed point is the next after the common part
            firstChangedPointIndex = Math.min(this._private__sortedTimePoints.length, newTimePoints.length);
        }
        if (firstChangedPointIndex === -1) {
            // if no time scale changed, then do nothing
            return -1;
        }
        // if time scale points are changed that means that we need to make full update to all series (with clearing points)
        // but first we need to synchronize indexes and re-fill time weights
        for (let index = firstChangedPointIndex; index < newTimePoints.length; ++index) {
            assignIndexToPointData(newTimePoints[index].pointData, index);
        }
        // re-fill time weights for point after the first changed one
        this._private__horzScaleBehavior.fillWeightsForPoints(newTimePoints, firstChangedPointIndex);
        this._private__sortedTimePoints = newTimePoints;
        return firstChangedPointIndex;
    }
    _private__getBaseIndex() {
        if (this._private__seriesRowsBySeries.size === 0) {
            // if we have no data then 'reset' the base index to null
            return null;
        }
        let baseIndex = 0;
        this._private__seriesRowsBySeries.forEach((data) => {
            if (data.length !== 0) {
                baseIndex = Math.max(baseIndex, data[data.length - 1]._internal_index);
            }
        });
        return baseIndex;
    }
    _private__getUpdateResponse(updatedSeries, firstChangedPointIndex, info) {
        const dataUpdateResponse = {
            _internal_series: new Map(),
            _internal_timeScale: {
                _internal_baseIndex: this._private__getBaseIndex(),
            },
        };
        if (firstChangedPointIndex !== -1) {
            // TODO: it's possible to make perf improvements by checking what series has data after firstChangedPointIndex
            // but let's skip for now
            this._private__seriesRowsBySeries.forEach((data, s) => {
                dataUpdateResponse._internal_series.set(s, {
                    _internal_data: data,
                    _internal_info: s === updatedSeries ? info : undefined,
                });
            });
            // if the series data was set to [] it will have already been removed from _seriesRowBySeries
            // meaning the forEach above won't add the series to the data update response
            // so we handle that case here
            if (!this._private__seriesRowsBySeries.has(updatedSeries)) {
                dataUpdateResponse._internal_series.set(updatedSeries, { _internal_data: [], _internal_info: info });
            }
            dataUpdateResponse._internal_timeScale._internal_points = this._private__sortedTimePoints;
            dataUpdateResponse._internal_timeScale._internal_firstChangedPointIndex = firstChangedPointIndex;
        }
        else {
            const seriesData = this._private__seriesRowsBySeries.get(updatedSeries);
            // if no seriesData found that means that we just removed the series
            dataUpdateResponse._internal_series.set(updatedSeries, { _internal_data: seriesData || [], _internal_info: info });
        }
        return dataUpdateResponse;
    }
}
function assignIndexToPointData(pointData, index) {
    // first, nevertheless update index of point data ("make it valid")
    pointData._internal_index = index;
    // and then we need to sync indexes for all series
    pointData._internal_mapping.forEach((seriesRow) => {
        seriesRow._internal_index = index;
    });
}

function lowerBoundItemsCompare(item, time) {
    return item._internal_time < time;
}
function upperBoundItemsCompare(item, time) {
    return time < item._internal_time;
}
function visibleTimedValues(items, range, extendedRange) {
    const firstBar = range._internal_left();
    const lastBar = range._internal_right();
    const from = lowerBound(items, firstBar, lowerBoundItemsCompare);
    const to = upperBound(items, lastBar, upperBoundItemsCompare);
    if (!extendedRange) {
        return { from, to };
    }
    let extendedFrom = from;
    let extendedTo = to;
    if (from > 0 && from < items.length && items[from]._internal_time >= firstBar) {
        extendedFrom = from - 1;
    }
    if (to > 0 && to < items.length && items[to - 1]._internal_time <= lastBar) {
        extendedTo = to + 1;
    }
    return { from: extendedFrom, to: extendedTo };
}

class SeriesPaneViewBase {
    constructor(series, model, extendedVisibleRange) {
        this._internal__invalidated = true;
        this._internal__dataInvalidated = true;
        this._internal__optionsInvalidated = true;
        this._internal__items = [];
        this._internal__itemsVisibleRange = null;
        this._internal__series = series;
        this._internal__model = model;
        this._private__extendedVisibleRange = extendedVisibleRange;
    }
    _internal_update(updateType) {
        this._internal__invalidated = true;
        if (updateType === 'data') {
            this._internal__dataInvalidated = true;
        }
        if (updateType === 'options') {
            this._internal__optionsInvalidated = true;
        }
    }
    _internal_renderer() {
        if (!this._internal__series._internal_visible()) {
            return null;
        }
        this._private__makeValid();
        return this._internal__itemsVisibleRange === null ? null : this._internal__renderer;
    }
    _internal__updateOptions() {
        this._internal__items = this._internal__items.map((item) => ({
            ...item,
            ...this._internal__series._internal_barColorer()._internal_barStyle(item._internal_time),
        }));
    }
    _internal__clearVisibleRange() {
        this._internal__itemsVisibleRange = null;
    }
    _private__makeValid() {
        if (this._internal__dataInvalidated) {
            this._internal__fillRawPoints();
            this._internal__dataInvalidated = false;
        }
        if (this._internal__optionsInvalidated) {
            this._internal__updateOptions();
            this._internal__optionsInvalidated = false;
        }
        if (this._internal__invalidated) {
            this._private__makeValidImpl();
            this._internal__invalidated = false;
        }
    }
    _private__makeValidImpl() {
        const priceScale = this._internal__series._internal_priceScale();
        const timeScale = this._internal__model._internal_timeScale();
        this._internal__clearVisibleRange();
        if (timeScale._internal_isEmpty() || priceScale._internal_isEmpty()) {
            return;
        }
        const visibleBars = timeScale._internal_visibleStrictRange();
        if (visibleBars === null) {
            return;
        }
        if (this._internal__series._internal_bars()._internal_size() === 0) {
            return;
        }
        const firstValue = this._internal__series._internal_firstValue();
        if (firstValue === null) {
            return;
        }
        this._internal__itemsVisibleRange = visibleTimedValues(this._internal__items, visibleBars, this._private__extendedVisibleRange);
        this._internal__convertToCoordinates(priceScale, timeScale, firstValue._internal_value);
        this._internal__prepareRendererData();
    }
}

class CustomSeriesPaneRendererWrapper {
    constructor(sourceRenderer, priceScale) {
        this._private__sourceRenderer = sourceRenderer;
        this._private__priceScale = priceScale;
    }
    _internal_draw(target, isHovered, hitTestData) {
        this._private__sourceRenderer.draw(target, this._private__priceScale, isHovered, hitTestData);
    }
}
class SeriesCustomPaneView extends SeriesPaneViewBase {
    constructor(series, model, paneView) {
        super(series, model, false);
        this._private__paneView = paneView;
        this._internal__renderer = new CustomSeriesPaneRendererWrapper(this._private__paneView.renderer(), (price) => {
            const firstValue = series._internal_firstValue();
            if (firstValue === null) {
                return null;
            }
            return series._internal_priceScale()._internal_priceToCoordinate(price, firstValue._internal_value);
        });
    }
    _internal_priceValueBuilder(plotRow) {
        return this._private__paneView.priceValueBuilder(plotRow);
    }
    _internal_isWhitespace(data) {
        return this._private__paneView.isWhitespace(data);
    }
    _internal__fillRawPoints() {
        const colorer = this._internal__series._internal_barColorer();
        this._internal__items = this._internal__series._internal_bars()._internal_rows()
            .map((row) => {
            return {
                _internal_time: row._internal_index,
                _internal_x: NaN,
                ...colorer._internal_barStyle(row._internal_index),
                _internal_originalData: row._internal_data,
            };
        });
    }
    _internal__convertToCoordinates(priceScale, timeScale) {
        timeScale._internal_indexesToCoordinates(this._internal__items, undefinedIfNull(this._internal__itemsVisibleRange));
    }
    _internal__prepareRendererData() {
        this._private__paneView.update({
            bars: this._internal__items.map(unwrapItemData),
            barSpacing: this._internal__model._internal_timeScale()._internal_barSpacing(),
            visibleRange: this._internal__itemsVisibleRange,
        }, this._internal__series._internal_options());
    }
}
function unwrapItemData(item) {
    return {
        x: item._internal_x,
        time: item._internal_time,
        originalData: item._internal_originalData,
        barColor: item._internal_barColor,
    };
}

const customStyleDefaults = {
    color: '#2196f3',
};
const createPaneView$6 = (series, model, customPaneView) => {
    const paneView = ensure(customPaneView);
    return new SeriesCustomPaneView(series, model, paneView);
};
const createCustomSeriesDefinition = (paneView) => {
    const definition = {
        type: 'Custom',
        isBuiltIn: false,
        defaultOptions: { ...customStyleDefaults, ...paneView.defaultOptions() },
        /**
         * @internal
         */
        _internal_createPaneView: createPaneView$6,
        _internal_customPaneView: paneView,
    };
    return definition;
};

const isSeriesDefinition = (value) => {
    return value._internal_createPaneView !== undefined;
};

function singleValueData(plotRow) {
    const data = {
        value: plotRow._internal_value[3 /* PlotRowValueIndex.Close */],
        time: plotRow._internal_originalTime,
    };
    if (plotRow._internal_customValues !== undefined) {
        data.customValues = plotRow._internal_customValues;
    }
    return data;
}
function lineData(plotRow) {
    const result = singleValueData(plotRow);
    if (plotRow._internal_color !== undefined) {
        result.color = plotRow._internal_color;
    }
    return result;
}
function areaData(plotRow) {
    const result = singleValueData(plotRow);
    if (plotRow._internal_lineColor !== undefined) {
        result.lineColor = plotRow._internal_lineColor;
    }
    if (plotRow._internal_topColor !== undefined) {
        result.topColor = plotRow._internal_topColor;
    }
    if (plotRow._internal_bottomColor !== undefined) {
        result.bottomColor = plotRow._internal_bottomColor;
    }
    return result;
}
function baselineData(plotRow) {
    const result = singleValueData(plotRow);
    if (plotRow._internal_topLineColor !== undefined) {
        result.topLineColor = plotRow._internal_topLineColor;
    }
    if (plotRow._internal_bottomLineColor !== undefined) {
        result.bottomLineColor = plotRow._internal_bottomLineColor;
    }
    if (plotRow._internal_topFillColor1 !== undefined) {
        result.topFillColor1 = plotRow._internal_topFillColor1;
    }
    if (plotRow._internal_topFillColor2 !== undefined) {
        result.topFillColor2 = plotRow._internal_topFillColor2;
    }
    if (plotRow._internal_bottomFillColor1 !== undefined) {
        result.bottomFillColor1 = plotRow._internal_bottomFillColor1;
    }
    if (plotRow._internal_bottomFillColor2 !== undefined) {
        result.bottomFillColor2 = plotRow._internal_bottomFillColor2;
    }
    return result;
}
function ohlcData(plotRow) {
    const data = {
        open: plotRow._internal_value[0 /* PlotRowValueIndex.Open */],
        high: plotRow._internal_value[1 /* PlotRowValueIndex.High */],
        low: plotRow._internal_value[2 /* PlotRowValueIndex.Low */],
        close: plotRow._internal_value[3 /* PlotRowValueIndex.Close */],
        time: plotRow._internal_originalTime,
    };
    if (plotRow._internal_customValues !== undefined) {
        data.customValues = plotRow._internal_customValues;
    }
    return data;
}
function barData(plotRow) {
    const result = ohlcData(plotRow);
    if (plotRow._internal_color !== undefined) {
        result.color = plotRow._internal_color;
    }
    return result;
}
function candlestickData(plotRow) {
    const result = ohlcData(plotRow);
    const { _internal_color: color, _internal_borderColor: borderColor, _internal_wickColor: wickColor } = plotRow;
    if (color !== undefined) {
        result.color = color;
    }
    if (borderColor !== undefined) {
        result.borderColor = borderColor;
    }
    if (wickColor !== undefined) {
        result.wickColor = wickColor;
    }
    return result;
}
function getSeriesDataCreator(seriesType) {
    const seriesPlotRowToDataMap = {
        Area: (areaData),
        Line: (lineData),
        Baseline: (baselineData),
        Histogram: (lineData),
        Bar: (barData),
        Candlestick: (candlestickData),
        Custom: (customData),
    };
    return seriesPlotRowToDataMap[seriesType];
}
function customData(plotRow) {
    const time = plotRow._internal_originalTime;
    return {
        ...plotRow._internal_data,
        time,
    };
}

const crosshairOptionsDefaults = {
    vertLine: {
        color: '#9598A1',
        width: 1,
        style: 3 /* LineStyle.LargeDashed */,
        visible: true,
        labelVisible: true,
        labelBackgroundColor: '#131722',
    },
    horzLine: {
        color: '#9598A1',
        width: 1,
        style: 3 /* LineStyle.LargeDashed */,
        visible: true,
        labelVisible: true,
        labelBackgroundColor: '#131722',
    },
    mode: 1 /* CrosshairMode.Magnet */,
};

const gridOptionsDefaults = {
    vertLines: {
        color: '#D6DCDE',
        style: 0 /* LineStyle.Solid */,
        visible: true,
    },
    horzLines: {
        color: '#D6DCDE',
        style: 0 /* LineStyle.Solid */,
        visible: true,
    },
};

const layoutOptionsDefaults = {
    background: {
        type: "solid" /* ColorType.Solid */,
        color: '#FFFFFF',
    },
    textColor: '#191919',
    fontSize: 12,
    fontFamily: defaultFontFamily,
    panes: {
        enableResize: true,
        separatorColor: '#E0E3EB',
        separatorHoverColor: 'rgba(178, 181, 189, 0.2)',
    },
    attributionLogo: true,
    colorSpace: 'srgb',
    colorParsers: [],
};

const priceScaleOptionsDefaults = {
    autoScale: true,
    mode: 0 /* PriceScaleMode.Normal */,
    invertScale: false,
    alignLabels: true,
    borderVisible: true,
    borderColor: '#2B2B43',
    entireTextOnly: false,
    visible: false,
    ticksVisible: false,
    scaleMargins: {
        bottom: 0.1,
        top: 0.2,
    },
    minimumWidth: 0,
};

const timeScaleOptionsDefaults = {
    rightOffset: 0,
    barSpacing: 6,
    minBarSpacing: 0.5,
    maxBarSpacing: 0,
    fixLeftEdge: false,
    fixRightEdge: false,
    lockVisibleTimeRangeOnResize: false,
    rightBarStaysOnScroll: false,
    borderVisible: true,
    borderColor: '#2B2B43',
    visible: true,
    timeVisible: false,
    secondsVisible: true,
    shiftVisibleRangeOnNewBar: true,
    allowShiftVisibleRangeOnWhitespaceReplacement: false,
    ticksVisible: false,
    uniformDistribution: false,
    minimumHeight: 0,
    allowBoldLabels: true,
    ignoreWhitespaceIndices: false,
};

function chartOptionsDefaults() {
    return {
        width: 0,
        height: 0,
        autoSize: false,
        layout: layoutOptionsDefaults,
        crosshair: crosshairOptionsDefaults,
        grid: gridOptionsDefaults,
        overlayPriceScales: {
            ...priceScaleOptionsDefaults,
        },
        leftPriceScale: {
            ...priceScaleOptionsDefaults,
            visible: false,
        },
        rightPriceScale: {
            ...priceScaleOptionsDefaults,
            visible: true,
        },
        timeScale: timeScaleOptionsDefaults,
        localization: {
            locale: isRunningOnClientSide ? navigator.language : '',
            dateFormat: 'dd MMM \'yy',
        },
        handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: true,
        },
        handleScale: {
            axisPressedMouseMove: {
                time: true,
                price: true,
            },
            axisDoubleClickReset: {
                time: true,
                price: true,
            },
            mouseWheel: true,
            pinch: true,
        },
        kineticScroll: {
            mouse: false,
            touch: true,
        },
        trackingMode: {
            exitMode: 1 /* TrackingModeExitMode.OnNextTap */,
        },
    };
}

class PriceScaleApi {
    constructor(chartWidget, priceScaleId, paneIndex) {
        this._private__chartWidget = chartWidget;
        this._private__priceScaleId = priceScaleId;
        this._private__paneIndex = paneIndex ?? 0;
    }
    applyOptions(options) {
        this._private__chartWidget._internal_model()._internal_applyPriceScaleOptions(this._private__priceScaleId, options, this._private__paneIndex);
    }
    options() {
        return this._private__priceScale()._internal_options();
    }
    width() {
        if (!isDefaultPriceScale(this._private__priceScaleId)) {
            return 0;
        }
        return this._private__chartWidget._internal_getPriceAxisWidth(this._private__priceScaleId);
    }
    _private__priceScale() {
        return ensureNotNull(this._private__chartWidget._internal_model()._internal_findPriceScale(this._private__priceScaleId, this._private__paneIndex))._internal_priceScale;
    }
}

class PaneApi {
    constructor(chartWidget, seriesApiGetter, pane, chartApi) {
        this._private__chartWidget = chartWidget;
        this._private__pane = pane;
        this._private__seriesApiGetter = seriesApiGetter;
        this._internal__chartApi = chartApi;
    }
    getHeight() {
        return this._private__pane._internal_height();
    }
    setHeight(height) {
        const chartModel = this._private__chartWidget._internal_model();
        const paneIndex = chartModel._internal_getPaneIndex(this._private__pane);
        chartModel._internal_changePanesHeight(paneIndex, height);
    }
    paneIndex() {
        return this._private__chartWidget._internal_model()._internal_getPaneIndex(this._private__pane);
    }
    moveTo(paneIndex) {
        const currentIndex = this.paneIndex();
        if (currentIndex === paneIndex) {
            return;
        }
        assert(paneIndex >= 0 && paneIndex < this._private__chartWidget._internal_paneWidgets().length, 'Invalid pane index');
        this._private__chartWidget._internal_model()._internal_swapPanes(currentIndex, paneIndex);
    }
    getSeries() {
        return this._private__pane._internal_series().map((source) => this._private__seriesApiGetter(source)) ?? [];
    }
    getHTMLElement() {
        return this._private__chartWidget._internal_paneWidgets()[this.paneIndex()]._internal_getElement();
    }
    attachPrimitive(primitive) {
        this._private__pane._internal_attachPrimitive(primitive);
        if (primitive.attached) {
            primitive.attached({
                chart: this._internal__chartApi,
                requestUpdate: () => this._private__pane._internal_model()._internal_fullUpdate(),
            });
        }
    }
    detachPrimitive(primitive) {
        this._private__pane._internal_detachPrimitive(primitive);
    }
    priceScale(priceScaleId) {
        const priceScale = this._private__pane._internal_priceScaleById(priceScaleId);
        if (priceScale === null) {
            throw new Error(`Cannot find price scale with id: ${priceScaleId}`);
        }
        return new PriceScaleApi(this._private__chartWidget, priceScaleId, this.paneIndex());
    }
}

/// <reference types="_build-time-constants" />
function checkPriceLineOptions(options) {
    assert(typeof options.price === 'number', `the type of 'price' price line's property must be a number, got '${typeof options.price}'`);
}
function checkItemsAreOrdered(data, bh, allowDuplicates = false) {
    if (data.length === 0) {
        return;
    }
    let prevTime = bh.key(data[0].time);
    for (let i = 1; i < data.length; ++i) {
        const currentTime = bh.key(data[i].time);
        const checkResult = allowDuplicates ? prevTime <= currentTime : prevTime < currentTime;
        assert(checkResult, `data must be asc ordered by time, index=${i}, time=${currentTime}, prev time=${prevTime}`);
        prevTime = currentTime;
    }
}
function checkSeriesValuesType(type, data) {
    data.forEach(getChecker(type));
}
function getChecker(type) {
    switch (type) {
        case 'Bar':
        case 'Candlestick':
            return checkBarItem.bind(null, type);
        case 'Area':
        case 'Baseline':
        case 'Line':
        case 'Histogram':
            return checkLineItem.bind(null, type);
        case 'Custom':
            return checkCustomItem.bind(null);
    }
}
function checkBarItem(type, barItem) {
    if (!isFulfilledData(barItem)) {
        return;
    }
    ['open', 'high', 'low', 'close'].forEach((key) => {
        assert(typeof barItem[key] === 'number', `${type} series item data value of ${key} must be a number, got=${typeof barItem[key]}, value=${barItem[key]}`);
        assert(isSafeValue(barItem[key]), `${type} series item data value of ${key} must be between ${MIN_SAFE_VALUE.toPrecision(16)} and ${MAX_SAFE_VALUE.toPrecision(16)}, got=${typeof barItem[key]}, value=${barItem[key]}`);
    });
}
function checkLineItem(type, lineItem) {
    if (!isFulfilledData(lineItem)) {
        return;
    }
    assert(typeof lineItem.value === 'number', `${type} series item data value must be a number, got=${typeof lineItem.value}, value=${lineItem.value}`);
    assert(isSafeValue(lineItem.value), `${type} series item data value must be between ${MIN_SAFE_VALUE.toPrecision(16)} and ${MAX_SAFE_VALUE.toPrecision(16)}, got=${typeof lineItem.value}, value=${lineItem.value}`);
}
function checkCustomItem(
// type: 'Custom',
// customItem: SeriesDataItemTypeMap[typeof type]
) {
    // Nothing to check yet...
    return;
}
const MIN_SAFE_VALUE = Number.MIN_SAFE_INTEGER / 100;
const MAX_SAFE_VALUE = Number.MAX_SAFE_INTEGER / 100;
function isSafeValue(value) {
    return value >= MIN_SAFE_VALUE && value <= MAX_SAFE_VALUE;
}

const priceLineOptionsDefaults = {
    color: '#FF0000',
    price: 0,
    lineStyle: 2 /* LineStyle.Dashed */,
    lineWidth: 1,
    lineVisible: true,
    axisLabelVisible: true,
    title: '',
    axisLabelColor: '',
    axisLabelTextColor: '',
};

class PriceLine {
    constructor(priceLine) {
        this._private__priceLine = priceLine;
    }
    applyOptions(options) {
        this._private__priceLine._internal_applyOptions(options);
    }
    options() {
        return this._private__priceLine._internal_options();
    }
    _internal_priceLine() {
        return this._private__priceLine;
    }
}

class SeriesApi {
    constructor(series, dataUpdatesConsumer, priceScaleApiProvider, chartApi, horzScaleBehavior, paneApiGetter) {
        this._private__dataChangedDelegate = new Delegate();
        this._internal__series = series;
        this._internal__dataUpdatesConsumer = dataUpdatesConsumer;
        this._private__priceScaleApiProvider = priceScaleApiProvider;
        this._private__horzScaleBehavior = horzScaleBehavior;
        this._internal__chartApi = chartApi;
        this._private__paneApiGetter = paneApiGetter;
    }
    _internal_destroy() {
        this._private__dataChangedDelegate._internal_destroy();
    }
    priceFormatter() {
        return this._internal__series._internal_formatter();
    }
    priceToCoordinate(price) {
        const firstValue = this._internal__series._internal_firstValue();
        if (firstValue === null) {
            return null;
        }
        return this._internal__series._internal_priceScale()._internal_priceToCoordinate(price, firstValue._internal_value);
    }
    coordinateToPrice(coordinate) {
        const firstValue = this._internal__series._internal_firstValue();
        if (firstValue === null) {
            return null;
        }
        return this._internal__series._internal_priceScale()._internal_coordinateToPrice(coordinate, firstValue._internal_value);
    }
    barsInLogicalRange(range) {
        if (range === null) {
            return null;
        }
        // we use TimeScaleVisibleRange here to convert LogicalRange to strict range properly
        const correctedRange = new TimeScaleVisibleRange(new RangeImpl(range.from, range.to))._internal_strictRange();
        const bars = this._internal__series._internal_bars();
        if (bars._internal_isEmpty()) {
            return null;
        }
        const dataFirstBarInRange = bars._internal_search(correctedRange._internal_left(), 1 /* MismatchDirection.NearestRight */);
        const dataLastBarInRange = bars._internal_search(correctedRange._internal_right(), -1 /* MismatchDirection.NearestLeft */);
        const dataFirstIndex = ensureNotNull(bars._internal_firstIndex());
        const dataLastIndex = ensureNotNull(bars._internal_lastIndex());
        // this means that we request data in the data gap
        // e.g. let's say we have series with data [0..10, 30..60]
        // and we request bars info in range [15, 25]
        // thus, dataFirstBarInRange will be with index 30 and dataLastBarInRange with 10
        if (dataFirstBarInRange !== null && dataLastBarInRange !== null && dataFirstBarInRange._internal_index > dataLastBarInRange._internal_index) {
            return {
                barsBefore: range.from - dataFirstIndex,
                barsAfter: dataLastIndex - range.to,
            };
        }
        const barsBefore = (dataFirstBarInRange === null || dataFirstBarInRange._internal_index === dataFirstIndex)
            ? range.from - dataFirstIndex
            : dataFirstBarInRange._internal_index - dataFirstIndex;
        const barsAfter = (dataLastBarInRange === null || dataLastBarInRange._internal_index === dataLastIndex)
            ? dataLastIndex - range.to
            : dataLastIndex - dataLastBarInRange._internal_index;
        const result = { barsBefore, barsAfter };
        // actually they can't exist separately
        if (dataFirstBarInRange !== null && dataLastBarInRange !== null) {
            result.from = dataFirstBarInRange._internal_originalTime;
            result.to = dataLastBarInRange._internal_originalTime;
        }
        return result;
    }
    setData(data) {
        checkItemsAreOrdered(data, this._private__horzScaleBehavior);
        checkSeriesValuesType(this._internal__series._internal_seriesType(), data);
        this._internal__dataUpdatesConsumer._internal_applyNewData(this._internal__series, data);
        this._private__onDataChanged('full');
    }
    update(bar, historicalUpdate = false) {
        checkSeriesValuesType(this._internal__series._internal_seriesType(), [bar]);
        this._internal__dataUpdatesConsumer._internal_updateData(this._internal__series, bar, historicalUpdate);
        this._private__onDataChanged('update');
    }
    dataByIndex(logicalIndex, mismatchDirection) {
        const data = this._internal__series._internal_bars()._internal_search(logicalIndex, mismatchDirection);
        if (data === null) {
            // actually it can be a whitespace
            return null;
        }
        const creator = getSeriesDataCreator(this.seriesType());
        return creator(data);
    }
    data() {
        const seriesCreator = getSeriesDataCreator(this.seriesType());
        const rows = this._internal__series._internal_bars()._internal_rows();
        return rows.map((row) => seriesCreator(row));
    }
    subscribeDataChanged(handler) {
        this._private__dataChangedDelegate._internal_subscribe(handler);
    }
    unsubscribeDataChanged(handler) {
        this._private__dataChangedDelegate._internal_unsubscribe(handler);
    }
    applyOptions(options) {
        this._internal__series._internal_applyOptions(options);
    }
    options() {
        return clone(this._internal__series._internal_options());
    }
    priceScale() {
        return this._private__priceScaleApiProvider.priceScale(this._internal__series._internal_priceScale()._internal_id(), this.getPane().paneIndex());
    }
    createPriceLine(options) {
        checkPriceLineOptions(options);
        const strictOptions = merge(clone(priceLineOptionsDefaults), options);
        const priceLine = this._internal__series._internal_createPriceLine(strictOptions);
        return new PriceLine(priceLine);
    }
    removePriceLine(line) {
        this._internal__series._internal_removePriceLine(line._internal_priceLine());
    }
    priceLines() {
        return this._internal__series._internal_priceLines().map((priceLine) => new PriceLine(priceLine));
    }
    seriesType() {
        return this._internal__series._internal_seriesType();
    }
    attachPrimitive(primitive) {
        // at this point we cast the generic to unknown because we
        // don't want the model to know the types of the API (◑_◑)
        this._internal__series._internal_attachPrimitive(primitive);
        if (primitive.attached) {
            primitive.attached({
                chart: this._internal__chartApi,
                series: this,
                requestUpdate: () => this._internal__series._internal_model()._internal_fullUpdate(),
                horzScaleBehavior: this._private__horzScaleBehavior,
            });
        }
    }
    detachPrimitive(primitive) {
        this._internal__series._internal_detachPrimitive(primitive);
        if (primitive.detached) {
            primitive.detached();
        }
        this._internal__series._internal_model()._internal_fullUpdate();
    }
    getPane() {
        const series = this._internal__series;
        const pane = ensureNotNull(this._internal__series._internal_model()._internal_paneForSource(series));
        return this._private__paneApiGetter(pane);
    }
    moveToPane(paneIndex) {
        this._internal__series._internal_model()._internal_moveSeriesToPane(this._internal__series, paneIndex);
    }
    _private__onDataChanged(scope) {
        if (this._private__dataChangedDelegate._internal_hasListeners()) {
            this._private__dataChangedDelegate._internal_fire(scope);
        }
    }
}

class TimeScaleApi {
    constructor(model, timeAxisWidget, horzScaleBehavior) {
        this._private__timeRangeChanged = new Delegate();
        this._private__logicalRangeChanged = new Delegate();
        this._private__sizeChanged = new Delegate();
        this._private__model = model;
        this._private__timeScale = model._internal_timeScale();
        this._private__timeAxisWidget = timeAxisWidget;
        this._private__timeScale._internal_visibleBarsChanged()._internal_subscribe(this._private__onVisibleBarsChanged.bind(this));
        this._private__timeScale._internal_logicalRangeChanged()._internal_subscribe(this._private__onVisibleLogicalRangeChanged.bind(this));
        this._private__timeAxisWidget._internal_sizeChanged()._internal_subscribe(this._private__onSizeChanged.bind(this));
        this._private__horzScaleBehavior = horzScaleBehavior;
    }
    _internal_destroy() {
        this._private__timeScale._internal_visibleBarsChanged()._internal_unsubscribeAll(this);
        this._private__timeScale._internal_logicalRangeChanged()._internal_unsubscribeAll(this);
        this._private__timeAxisWidget._internal_sizeChanged()._internal_unsubscribeAll(this);
        this._private__timeRangeChanged._internal_destroy();
        this._private__logicalRangeChanged._internal_destroy();
        this._private__sizeChanged._internal_destroy();
    }
    scrollPosition() {
        return this._private__timeScale._internal_rightOffset();
    }
    scrollToPosition(position, animated) {
        if (!animated) {
            this._private__model._internal_setRightOffset(position);
            return;
        }
        this._private__timeScale._internal_scrollToOffsetAnimated(position, 1000 /* Constants.AnimationDurationMs */);
    }
    scrollToRealTime() {
        this._private__timeScale._internal_scrollToRealTime();
    }
    getVisibleRange() {
        const timeRange = this._private__timeScale._internal_visibleTimeRange();
        if (timeRange === null) {
            return null;
        }
        return {
            from: timeRange.from.originalTime,
            to: timeRange.to.originalTime,
        };
    }
    setVisibleRange(range) {
        const convertedRange = {
            from: this._private__horzScaleBehavior.convertHorzItemToInternal(range.from),
            to: this._private__horzScaleBehavior.convertHorzItemToInternal(range.to),
        };
        const logicalRange = this._private__timeScale._internal_logicalRangeForTimeRange(convertedRange);
        this._private__model._internal_setTargetLogicalRange(logicalRange);
    }
    getVisibleLogicalRange() {
        const logicalRange = this._private__timeScale._internal_visibleLogicalRange();
        if (logicalRange === null) {
            return null;
        }
        return {
            from: logicalRange._internal_left(),
            to: logicalRange._internal_right(),
        };
    }
    setVisibleLogicalRange(range) {
        assert(range.from <= range.to, 'The from index cannot be after the to index.');
        this._private__model._internal_setTargetLogicalRange(range);
    }
    resetTimeScale() {
        this._private__model._internal_resetTimeScale();
    }
    fitContent() {
        this._private__model._internal_fitContent();
    }
    logicalToCoordinate(logical) {
        const timeScale = this._private__model._internal_timeScale();
        if (timeScale._internal_isEmpty()) {
            return null;
        }
        else {
            return timeScale._internal_indexToCoordinate(logical);
        }
    }
    coordinateToLogical(x) {
        if (this._private__timeScale._internal_isEmpty()) {
            return null;
        }
        else {
            return this._private__timeScale._internal_coordinateToIndex(x);
        }
    }
    timeToIndex(time, findNearest) {
        const timePoint = this._private__horzScaleBehavior.convertHorzItemToInternal(time);
        return this._private__timeScale._internal_timeToIndex(timePoint, findNearest);
    }
    timeToCoordinate(time) {
        const timePointIndex = this.timeToIndex(time, false);
        if (timePointIndex === null) {
            return null;
        }
        return this._private__timeScale._internal_indexToCoordinate(timePointIndex);
    }
    coordinateToTime(x) {
        const timeScale = this._private__model._internal_timeScale();
        const timePointIndex = timeScale._internal_coordinateToIndex(x);
        const timePoint = timeScale._internal_indexToTimeScalePoint(timePointIndex);
        if (timePoint === null) {
            return null;
        }
        return timePoint.originalTime;
    }
    width() {
        return this._private__timeAxisWidget._internal_getSize().width;
    }
    height() {
        return this._private__timeAxisWidget._internal_getSize().height;
    }
    subscribeVisibleTimeRangeChange(handler) {
        this._private__timeRangeChanged._internal_subscribe(handler);
    }
    unsubscribeVisibleTimeRangeChange(handler) {
        this._private__timeRangeChanged._internal_unsubscribe(handler);
    }
    subscribeVisibleLogicalRangeChange(handler) {
        this._private__logicalRangeChanged._internal_subscribe(handler);
    }
    unsubscribeVisibleLogicalRangeChange(handler) {
        this._private__logicalRangeChanged._internal_unsubscribe(handler);
    }
    subscribeSizeChange(handler) {
        this._private__sizeChanged._internal_subscribe(handler);
    }
    unsubscribeSizeChange(handler) {
        this._private__sizeChanged._internal_unsubscribe(handler);
    }
    applyOptions(options) {
        this._private__timeScale._internal_applyOptions(options);
    }
    options() {
        return {
            ...clone(this._private__timeScale._internal_options()),
            barSpacing: this._private__timeScale._internal_barSpacing(),
        };
    }
    _private__onVisibleBarsChanged() {
        if (this._private__timeRangeChanged._internal_hasListeners()) {
            this._private__timeRangeChanged._internal_fire(this.getVisibleRange());
        }
    }
    _private__onVisibleLogicalRangeChanged() {
        if (this._private__logicalRangeChanged._internal_hasListeners()) {
            this._private__logicalRangeChanged._internal_fire(this.getVisibleLogicalRange());
        }
    }
    _private__onSizeChanged(size) {
        this._private__sizeChanged._internal_fire(size.width, size.height);
    }
}

/// <reference types="_build-time-constants" />
function patchPriceFormat(priceFormat) {
    if (priceFormat === undefined || priceFormat.type === 'custom') {
        return;
    }
    const priceFormatBuiltIn = priceFormat;
    if (priceFormatBuiltIn.minMove !== undefined && priceFormatBuiltIn.precision === undefined) {
        priceFormatBuiltIn.precision = precisionByMinMove(priceFormatBuiltIn.minMove);
    }
}
function migrateHandleScaleScrollOptions(options) {
    if (isBoolean(options['handleScale'])) {
        const handleScale = options['handleScale'];
        options['handleScale'] = {
            axisDoubleClickReset: {
                time: handleScale,
                price: handleScale,
            },
            axisPressedMouseMove: {
                time: handleScale,
                price: handleScale,
            },
            mouseWheel: handleScale,
            pinch: handleScale,
        };
    }
    else if (options['handleScale'] !== undefined) {
        const { axisPressedMouseMove, axisDoubleClickReset } = options['handleScale'];
        if (isBoolean(axisPressedMouseMove)) {
            options['handleScale'].axisPressedMouseMove = {
                time: axisPressedMouseMove,
                price: axisPressedMouseMove,
            };
        }
        if (isBoolean(axisDoubleClickReset)) {
            options['handleScale'].axisDoubleClickReset = {
                time: axisDoubleClickReset,
                price: axisDoubleClickReset,
            };
        }
    }
    const handleScroll = options['handleScroll'];
    if (isBoolean(handleScroll)) {
        options['handleScroll'] = {
            horzTouchDrag: handleScroll,
            vertTouchDrag: handleScroll,
            mouseWheel: handleScroll,
            pressedMouseMove: handleScroll,
        };
    }
}
function toInternalOptions(options) {
    migrateHandleScaleScrollOptions(options);
    return options;
}
class ChartApi {
    constructor(container, horzScaleBehavior, options) {
        this._private__seriesMap = new Map();
        this._private__seriesMapReversed = new Map();
        this._private__clickedDelegate = new Delegate();
        this._private__dblClickedDelegate = new Delegate();
        this._private__crosshairMovedDelegate = new Delegate();
        this._private__panes = new WeakMap();
        this._private__dataLayer = new DataLayer(horzScaleBehavior);
        const internalOptions = (options === undefined) ?
            clone(chartOptionsDefaults()) :
            merge(clone(chartOptionsDefaults()), toInternalOptions(options));
        this._internal__horzScaleBehavior = horzScaleBehavior;
        this._private__chartWidget = new ChartWidget(container, internalOptions, horzScaleBehavior);
        this._private__chartWidget._internal_clicked()._internal_subscribe((paramSupplier) => {
            if (this._private__clickedDelegate._internal_hasListeners()) {
                this._private__clickedDelegate._internal_fire(this._private__convertMouseParams(paramSupplier()));
            }
        }, this);
        this._private__chartWidget._internal_dblClicked()._internal_subscribe((paramSupplier) => {
            if (this._private__dblClickedDelegate._internal_hasListeners()) {
                this._private__dblClickedDelegate._internal_fire(this._private__convertMouseParams(paramSupplier()));
            }
        }, this);
        this._private__chartWidget._internal_crosshairMoved()._internal_subscribe((paramSupplier) => {
            if (this._private__crosshairMovedDelegate._internal_hasListeners()) {
                this._private__crosshairMovedDelegate._internal_fire(this._private__convertMouseParams(paramSupplier()));
            }
        }, this);
        const model = this._private__chartWidget._internal_model();
        this._private__timeScaleApi = new TimeScaleApi(model, this._private__chartWidget._internal_timeAxisWidget(), this._internal__horzScaleBehavior);
    }
    remove() {
        this._private__chartWidget._internal_clicked()._internal_unsubscribeAll(this);
        this._private__chartWidget._internal_dblClicked()._internal_unsubscribeAll(this);
        this._private__chartWidget._internal_crosshairMoved()._internal_unsubscribeAll(this);
        this._private__timeScaleApi._internal_destroy();
        this._private__chartWidget._internal_destroy();
        this._private__seriesMap.clear();
        this._private__seriesMapReversed.clear();
        this._private__clickedDelegate._internal_destroy();
        this._private__dblClickedDelegate._internal_destroy();
        this._private__crosshairMovedDelegate._internal_destroy();
        this._private__dataLayer._internal_destroy();
    }
    resize(width, height, forceRepaint) {
        if (this.autoSizeActive()) {
            // We return early here instead of checking this within the actual _chartWidget.resize method
            // because this should only apply to external resize requests.
            warn(`Height and width values ignored because 'autoSize' option is enabled.`);
            return;
        }
        this._private__chartWidget._internal_resize(width, height, forceRepaint);
    }
    addCustomSeries(customPaneView, options = {}, paneIndex = 0) {
        const paneView = ensure(customPaneView);
        const definition = createCustomSeriesDefinition(paneView);
        return this._private__addSeriesImpl(definition, options, paneIndex);
    }
    addSeries(definition, options = {}, paneIndex = 0) {
        return this._private__addSeriesImpl(definition, options, paneIndex);
    }
    removeSeries(seriesApi) {
        const series = ensureDefined(this._private__seriesMap.get(seriesApi));
        const update = this._private__dataLayer._internal_removeSeries(series);
        const model = this._private__chartWidget._internal_model();
        model._internal_removeSeries(series);
        this._private__sendUpdateToChart(update);
        this._private__seriesMap.delete(seriesApi);
        this._private__seriesMapReversed.delete(series);
    }
    _internal_applyNewData(series, data) {
        this._private__sendUpdateToChart(this._private__dataLayer._internal_setSeriesData(series, data));
    }
    _internal_updateData(series, data, historicalUpdate) {
        this._private__sendUpdateToChart(this._private__dataLayer._internal_updateSeriesData(series, data, historicalUpdate));
    }
    subscribeClick(handler) {
        this._private__clickedDelegate._internal_subscribe(handler);
    }
    unsubscribeClick(handler) {
        this._private__clickedDelegate._internal_unsubscribe(handler);
    }
    subscribeCrosshairMove(handler) {
        this._private__crosshairMovedDelegate._internal_subscribe(handler);
    }
    unsubscribeCrosshairMove(handler) {
        this._private__crosshairMovedDelegate._internal_unsubscribe(handler);
    }
    subscribeDblClick(handler) {
        this._private__dblClickedDelegate._internal_subscribe(handler);
    }
    unsubscribeDblClick(handler) {
        this._private__dblClickedDelegate._internal_unsubscribe(handler);
    }
    priceScale(priceScaleId, paneIndex = 0) {
        return new PriceScaleApi(this._private__chartWidget, priceScaleId, paneIndex);
    }
    timeScale() {
        return this._private__timeScaleApi;
    }
    applyOptions(options) {
        {
            const colorSpace = options.layout?.colorSpace;
            if (colorSpace !== undefined && colorSpace !== this.options().layout.colorSpace) {
                throw new Error(`colorSpace option should not be changed once the chart has been created.`);
            }
            const colorParsers = options.layout?.colorParsers;
            if (colorParsers !== undefined && colorParsers !== this.options().layout.colorParsers) {
                throw new Error(`colorParsers option should not be changed once the chart has been created.`);
            }
        }
        this._private__chartWidget._internal_applyOptions(toInternalOptions(options));
    }
    options() {
        return this._private__chartWidget._internal_options();
    }
    takeScreenshot() {
        return this._private__chartWidget._internal_takeScreenshot();
    }
    removePane(index) {
        this._private__chartWidget._internal_model()._internal_removePane(index);
    }
    swapPanes(first, second) {
        this._private__chartWidget._internal_model()._internal_swapPanes(first, second);
    }
    autoSizeActive() {
        return this._private__chartWidget._internal_autoSizeActive();
    }
    chartElement() {
        return this._private__chartWidget._internal_element();
    }
    panes() {
        return this._private__chartWidget._internal_model()._internal_panes().map((pane) => this._private__getPaneApi(pane));
    }
    paneSize(paneIndex = 0) {
        const size = this._private__chartWidget._internal_paneSize(paneIndex);
        return {
            height: size.height,
            width: size.width,
        };
    }
    setCrosshairPosition(price, horizontalPosition, seriesApi) {
        const series = this._private__seriesMap.get(seriesApi);
        if (series === undefined) {
            return;
        }
        const pane = this._private__chartWidget._internal_model()._internal_paneForSource(series);
        if (pane === null) {
            return;
        }
        this._private__chartWidget._internal_model()._internal_setAndSaveSyntheticPosition(price, horizontalPosition, pane);
    }
    clearCrosshairPosition() {
        this._private__chartWidget._internal_model()._internal_clearCurrentPosition(true);
    }
    horzBehaviour() {
        return this._internal__horzScaleBehavior;
    }
    _private__addSeriesImpl(definition, options = {}, paneIndex = 0) {
        assert(isSeriesDefinition(definition));
        patchPriceFormat(options.priceFormat);
        if (definition.type === 'Candlestick') {
            fillUpDownCandlesticksColors(options);
        }
        const strictOptions = merge(clone(seriesOptionsDefaults), clone(definition.defaultOptions), options);
        const createPaneView = definition._internal_createPaneView;
        const series = new Series(this._private__chartWidget._internal_model(), definition.type, strictOptions, createPaneView, definition._internal_customPaneView);
        this._private__chartWidget._internal_model()._internal_addSeriesToPane(series, paneIndex);
        const res = new SeriesApi(series, this, this, this, this._internal__horzScaleBehavior, (pane) => this._private__getPaneApi(pane));
        this._private__seriesMap.set(res, series);
        this._private__seriesMapReversed.set(series, res);
        return res;
    }
    _private__sendUpdateToChart(update) {
        const model = this._private__chartWidget._internal_model();
        model._internal_updateTimeScale(update._internal_timeScale._internal_baseIndex, update._internal_timeScale._internal_points, update._internal_timeScale._internal_firstChangedPointIndex);
        update._internal_series.forEach((value, series) => series._internal_setData(value._internal_data, value._internal_info));
        model._internal_timeScale()._internal_recalculateIndicesWithData();
        model._internal_recalculateAllPanes();
    }
    _private__mapSeriesToApi(series) {
        return ensureDefined(this._private__seriesMapReversed.get(series));
    }
    _private__convertMouseParams(param) {
        const seriesData = new Map();
        param._internal_seriesData.forEach((plotRow, series) => {
            const seriesType = series._internal_seriesType();
            const data = getSeriesDataCreator(seriesType)(plotRow);
            if (seriesType !== 'Custom') {
                assert(isFulfilledData(data));
            }
            else {
                const customWhitespaceChecker = series._internal_customSeriesWhitespaceCheck();
                assert(!customWhitespaceChecker || customWhitespaceChecker(data) === false);
            }
            seriesData.set(this._private__mapSeriesToApi(series), data);
        });
        const hoveredSeries = param._internal_hoveredSeries === undefined ||
            !this._private__seriesMapReversed.has(param._internal_hoveredSeries)
            ? undefined
            : this._private__mapSeriesToApi(param._internal_hoveredSeries);
        return {
            time: param._internal_originalTime,
            logical: param._internal_index,
            point: param._internal_point,
            paneIndex: param._internal_paneIndex,
            hoveredSeries,
            hoveredObjectId: param._internal_hoveredObject,
            seriesData,
            sourceEvent: param._internal_touchMouseEventData,
        };
    }
    _private__getPaneApi(pane) {
        let result = this._private__panes.get(pane);
        if (!result) {
            result = new PaneApi(this._private__chartWidget, (series) => this._private__mapSeriesToApi(series), pane, this);
            this._private__panes.set(pane, result);
        }
        return result;
    }
}

function fetchHtmlElement(container) {
    if (isString(container)) {
        const element = document.getElementById(container);
        assert(element !== null, `Cannot find element in DOM with id=${container}`);
        return element;
    }
    return container;
}
/**
 * This function is the main entry point of the Lightweight Charting Library. If you are using time values
 * for the horizontal scale then it is recommended that you rather use the {@link createChart} function.
 *
 * @template HorzScaleItem - type of points on the horizontal scale
 * @template THorzScaleBehavior - type of horizontal axis strategy that encapsulate all the specific behaviors of the horizontal scale type
 *
 * @param container - ID of HTML element or element itself
 * @param horzScaleBehavior - Horizontal scale behavior
 * @param options - Any subset of options to be applied at start.
 * @returns An interface to the created chart
 */
function createChartEx(container, horzScaleBehavior, options) {
    const htmlElement = fetchHtmlElement(container);
    const res = new ChartApi(htmlElement, horzScaleBehavior, options);
    horzScaleBehavior.setOptions(res.options());
    return res;
}
/**
 * This function is the simplified main entry point of the Lightweight Charting Library with time points for the horizontal scale.
 *
 * @param container - ID of HTML element or element itself
 * @param options - Any subset of options to be applied at start.
 * @returns An interface to the created chart
 */
function createChart(container, options) {
    return createChartEx(container, new HorzScaleBehaviorTime(), HorzScaleBehaviorTime._internal_applyDefaults(options));
}
/**
 * Provides the default implementation of the horizontal scale (time-based) that can be used as a base for extending the horizontal scale with custom behavior.
 * This allows for the introduction of custom functionality without re-implementing the entire {@link IHorzScaleBehavior}&lt;{@link Time}&gt; interface.
 *
 * For further details, refer to the {@link createChartEx} chart constructor method.
 *
 * @returns An uninitialized class implementing the {@link IHorzScaleBehavior}&lt;{@link Time}&gt; interface
 */
function defaultHorzScaleBehavior() {
    return HorzScaleBehaviorTime;
}

class LinePaneViewBase extends SeriesPaneViewBase {
    constructor(series, model) {
        super(series, model, true);
    }
    _internal__convertToCoordinates(priceScale, timeScale, firstValue) {
        timeScale._internal_indexesToCoordinates(this._internal__items, undefinedIfNull(this._internal__itemsVisibleRange));
        priceScale._internal_pointsArrayToCoordinates(this._internal__items, firstValue, undefinedIfNull(this._internal__itemsVisibleRange));
    }
    _internal__createRawItemBase(time, price) {
        return {
            _internal_time: time,
            _internal_price: price,
            _internal_x: NaN,
            _internal_y: NaN,
        };
    }
    _internal__fillRawPoints() {
        const colorer = this._internal__series._internal_barColorer();
        this._internal__items = this._internal__series._internal_bars()._internal_rows().map((row) => {
            const value = row._internal_value[3 /* PlotRowValueIndex.Close */];
            return this._internal__createRawItem(row._internal_index, value, colorer);
        });
    }
}

function drawSeriesPointMarkers(renderingScope, items, pointMarkersRadius, visibleRange, 
// the values returned by styleGetter are compared using the operator !==,
// so if styleGetter returns objects, then styleGetter should return the same object for equal styles
styleGetter) {
    if (visibleRange.to - visibleRange.from <= 0) {
        return;
    }
    const { horizontalPixelRatio, verticalPixelRatio, context } = renderingScope;
    let prevStyle = null;
    const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
    const correction = (tickWidth % 2) / 2;
    const radius = pointMarkersRadius * verticalPixelRatio + correction;
    for (let i = visibleRange.to - 1; i >= visibleRange.from; --i) {
        const point = items[i];
        if (point) {
            const style = styleGetter(renderingScope, point);
            if (style !== prevStyle) {
                context.beginPath();
                if (prevStyle !== null) {
                    context.fill();
                }
                context.fillStyle = style;
                prevStyle = style;
            }
            const centerX = Math.round(point._internal_x * horizontalPixelRatio) + correction; // correct x coordinate only
            const centerY = point._internal_y * verticalPixelRatio;
            context.moveTo(centerX, centerY);
            context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        }
    }
    context.fill();
}

// eslint-disable-next-line max-params, complexity
function walkLine(renderingScope, items, lineType, visibleRange, barWidth, 
// the values returned by styleGetter are compared using the operator !==,
// so if styleGetter returns objects, then styleGetter should return the same object for equal styles
styleGetter, finishStyledArea) {
    if (items.length === 0 || visibleRange.from >= items.length || visibleRange.to <= 0) {
        return;
    }
    const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;
    const firstItem = items[visibleRange.from];
    let currentStyle = styleGetter(renderingScope, firstItem);
    let currentStyleFirstItem = firstItem;
    if (visibleRange.to - visibleRange.from < 2) {
        const halfBarWidth = barWidth / 2;
        ctx.beginPath();
        const item1 = { _internal_x: firstItem._internal_x - halfBarWidth, _internal_y: firstItem._internal_y };
        const item2 = { _internal_x: firstItem._internal_x + halfBarWidth, _internal_y: firstItem._internal_y };
        ctx.moveTo(item1._internal_x * horizontalPixelRatio, item1._internal_y * verticalPixelRatio);
        ctx.lineTo(item2._internal_x * horizontalPixelRatio, item2._internal_y * verticalPixelRatio);
        finishStyledArea(renderingScope, currentStyle, item1, item2);
    }
    else {
        const changeStyle = (newStyle, currentItem) => {
            finishStyledArea(renderingScope, currentStyle, currentStyleFirstItem, currentItem);
            ctx.beginPath();
            currentStyle = newStyle;
            currentStyleFirstItem = currentItem;
        };
        let currentItem = currentStyleFirstItem;
        ctx.beginPath();
        ctx.moveTo(firstItem._internal_x * horizontalPixelRatio, firstItem._internal_y * verticalPixelRatio);
        for (let i = visibleRange.from + 1; i < visibleRange.to; ++i) {
            currentItem = items[i];
            const itemStyle = styleGetter(renderingScope, currentItem);
            switch (lineType) {
                case 0 /* LineType.Simple */:
                    ctx.lineTo(currentItem._internal_x * horizontalPixelRatio, currentItem._internal_y * verticalPixelRatio);
                    break;
                case 1 /* LineType.WithSteps */:
                    ctx.lineTo(currentItem._internal_x * horizontalPixelRatio, items[i - 1]._internal_y * verticalPixelRatio);
                    if (itemStyle !== currentStyle) {
                        changeStyle(itemStyle, currentItem);
                        ctx.lineTo(currentItem._internal_x * horizontalPixelRatio, items[i - 1]._internal_y * verticalPixelRatio);
                    }
                    ctx.lineTo(currentItem._internal_x * horizontalPixelRatio, currentItem._internal_y * verticalPixelRatio);
                    break;
                case 2 /* LineType.Curved */: {
                    const [cp1, cp2] = getControlPoints(items, i - 1, i);
                    ctx.bezierCurveTo(cp1._internal_x * horizontalPixelRatio, cp1._internal_y * verticalPixelRatio, cp2._internal_x * horizontalPixelRatio, cp2._internal_y * verticalPixelRatio, currentItem._internal_x * horizontalPixelRatio, currentItem._internal_y * verticalPixelRatio);
                    break;
                }
            }
            if (lineType !== 1 /* LineType.WithSteps */ && itemStyle !== currentStyle) {
                changeStyle(itemStyle, currentItem);
                ctx.moveTo(currentItem._internal_x * horizontalPixelRatio, currentItem._internal_y * verticalPixelRatio);
            }
        }
        if (currentStyleFirstItem !== currentItem || currentStyleFirstItem === currentItem && lineType === 1 /* LineType.WithSteps */) {
            finishStyledArea(renderingScope, currentStyle, currentStyleFirstItem, currentItem);
        }
    }
}
const curveTension = 6;
function subtract(p1, p2) {
    return { _internal_x: p1._internal_x - p2._internal_x, _internal_y: p1._internal_y - p2._internal_y };
}
function add(p1, p2) {
    return { _internal_x: p1._internal_x + p2._internal_x, _internal_y: p1._internal_y + p2._internal_y };
}
function divide(p1, n) {
    return { _internal_x: p1._internal_x / n, _internal_y: p1._internal_y / n };
}
/**
 * @returns Two control points that can be used as arguments to {@link CanvasRenderingContext2D.bezierCurveTo} to draw a curved line between `points[fromPointIndex]` and `points[toPointIndex]`.
 */
function getControlPoints(points, fromPointIndex, toPointIndex) {
    const beforeFromPointIndex = Math.max(0, fromPointIndex - 1);
    const afterToPointIndex = Math.min(points.length - 1, toPointIndex + 1);
    const cp1 = add(points[fromPointIndex], divide(subtract(points[toPointIndex], points[beforeFromPointIndex]), curveTension));
    const cp2 = subtract(points[toPointIndex], divide(subtract(points[afterToPointIndex], points[fromPointIndex]), curveTension));
    return [cp1, cp2];
}

function finishStyledArea$1(scope, style) {
    const ctx = scope.context;
    ctx.strokeStyle = style;
    ctx.stroke();
}
class PaneRendererLineBase extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._internal__data = null;
    }
    _internal_setData(data) {
        this._internal__data = data;
    }
    _internal__drawImpl(renderingScope) {
        if (this._internal__data === null) {
            return;
        }
        const { _internal_items: items, _internal_visibleRange: visibleRange, _internal_barWidth: barWidth, _internal_lineType: lineType, _internal_lineWidth: lineWidth, _internal_lineStyle: lineStyle, _internal_pointMarkersRadius: pointMarkersRadius } = this._internal__data;
        if (visibleRange === null) {
            return;
        }
        const ctx = renderingScope.context;
        ctx.lineCap = 'butt';
        ctx.lineWidth = lineWidth * renderingScope.verticalPixelRatio;
        setLineStyle(ctx, lineStyle);
        ctx.lineJoin = 'round';
        const styleGetter = this._internal__strokeStyle.bind(this);
        if (lineType !== undefined) {
            walkLine(renderingScope, items, lineType, visibleRange, barWidth, styleGetter, finishStyledArea$1);
        }
        if (pointMarkersRadius) {
            drawSeriesPointMarkers(renderingScope, items, pointMarkersRadius, visibleRange, styleGetter);
        }
    }
}

class PaneRendererLine extends PaneRendererLineBase {
    _internal__strokeStyle(renderingScope, item) {
        return item._internal_lineColor;
    }
}

class SeriesLinePaneView extends LinePaneViewBase {
    constructor() {
        super(...arguments);
        this._internal__renderer = new PaneRendererLine();
    }
    _internal__createRawItem(time, price, colorer) {
        return {
            ...this._internal__createRawItemBase(time, price),
            ...colorer._internal_barStyle(time),
        };
    }
    _internal__prepareRendererData() {
        const options = this._internal__series._internal_options();
        const data = {
            _internal_items: this._internal__items,
            _internal_lineStyle: options.lineStyle,
            _internal_lineType: options.lineVisible ? options.lineType : undefined,
            _internal_lineWidth: options.lineWidth,
            _internal_pointMarkersRadius: options.pointMarkersVisible ? (options.pointMarkersRadius || options.lineWidth / 2 + 2) : undefined,
            _internal_visibleRange: this._internal__itemsVisibleRange,
            _internal_barWidth: this._internal__model._internal_timeScale()._internal_barSpacing(),
        };
        this._internal__renderer._internal_setData(data);
    }
}

const lineStyleDefaults = {
    color: '#2196f3',
    lineStyle: 0 /* LineStyle.Solid */,
    lineWidth: 3,
    lineType: 0 /* LineType.Simple */,
    lineVisible: true,
    crosshairMarkerVisible: true,
    crosshairMarkerRadius: 4,
    crosshairMarkerBorderColor: '',
    crosshairMarkerBorderWidth: 2,
    crosshairMarkerBackgroundColor: '',
    lastPriceAnimation: 0 /* LastPriceAnimationMode.Disabled */,
    pointMarkersVisible: false,
};
const createPaneView$5 = (series, model) => new SeriesLinePaneView(series, model);
const createLineSeries = () => {
    const definition = {
        type: 'Line',
        isBuiltIn: true,
        defaultOptions: lineStyleDefaults,
        /**
         * @internal
         */
        _internal_createPaneView: createPaneView$5,
    };
    return definition;
};
const lineSeries = createLineSeries();

function createDebouncedMicroTaskHandler(callback) {
    let scheduled = false;
    return function (...args) {
        if (!scheduled) {
            scheduled = true;
            queueMicrotask(() => {
                callback(...args);
                scheduled = false;
            });
        }
    };
}
function markWithGreaterWeight$1(a, b) {
    return a.weight > b.weight ? a : b;
}
function toInternalHorzScaleItem(item) {
    return item;
}
function fromInternalHorzScaleItem(item) {
    return item;
}
class YieldCurveHorzScaleBehavior {
    constructor() {
        this._private__pointsChangedDelegate = new Delegate();
        this._private__invalidateWhitespace = createDebouncedMicroTaskHandler(() => this._private__pointsChangedDelegate._internal_fire(this._private__largestIndex));
        this._private__largestIndex = 0;
    }
    /** Data changes might require that the whitespace be generated again */
    _internal_whitespaceInvalidated() {
        return this._private__pointsChangedDelegate;
    }
    _internal_destroy() {
        this._private__pointsChangedDelegate._internal_destroy();
    }
    options() {
        return this._private__options;
    }
    setOptions(options) {
        this._private__options = options;
    }
    preprocessData(data) {
        // No preprocessing needed for yield curve data
    }
    updateFormatter(options) {
        if (!this._private__options) {
            return;
        }
        this._private__options.localization = options;
    }
    createConverterToInternalObj(data) {
        this._private__invalidateWhitespace();
        return (time) => {
            if (time > this._private__largestIndex) {
                this._private__largestIndex = time;
            }
            return toInternalHorzScaleItem(time);
        };
    }
    key(internalItem) {
        return internalItem;
    }
    cacheKey(internalItem) {
        return fromInternalHorzScaleItem(internalItem);
    }
    convertHorzItemToInternal(item) {
        return toInternalHorzScaleItem(item);
    }
    formatHorzItem(item) {
        return this._private__formatTime(item);
    }
    formatTickmark(item) {
        return this._private__formatTime(item.time);
    }
    maxTickMarkWeight(marks) {
        return marks.reduce(markWithGreaterWeight$1, marks[0]).weight;
    }
    fillWeightsForPoints(sortedTimePoints, startIndex) {
        const timeWeight = (time) => {
            if (time % 120 === 0) {
                return 10;
            }
            if (time % 60 === 0) {
                return 9;
            }
            if (time % 36 === 0) {
                return 8;
            }
            if (time % 12 === 0) {
                return 7;
            }
            if (time % 6 === 0) {
                return 6;
            }
            if (time % 3 === 0) {
                return 5;
            }
            if (time % 1 === 0) {
                return 4;
            }
            return 0;
        };
        for (let index = startIndex; index < sortedTimePoints.length; ++index) {
            sortedTimePoints[index].timeWeight = timeWeight(fromInternalHorzScaleItem(sortedTimePoints[index].time));
        }
        this._private__largestIndex = fromInternalHorzScaleItem(sortedTimePoints[sortedTimePoints.length - 1].time);
        this._private__invalidateWhitespace();
    }
    _private__formatTime(months) {
        if (this._private__options.localization?.timeFormatter) {
            return this._private__options.localization.timeFormatter(months);
        }
        if (months < 12) {
            return `${months}M`;
        }
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (remainingMonths === 0) {
            return `${years}Y`;
        }
        return `${years}Y${remainingMonths}M`;
    }
}

const yieldChartOptionsDefaults = {
    baseResolution: 1,
    minimumTimeRange: 120,
    startTimeRange: 0,
};

function generateWhitespaceData({ _internal_start: start, _internal_end: end, _internal_resolution: resolution, }) {
    return Array.from({ length: Math.floor((end - start) / resolution) + 1 }, 
    // eslint-disable-next-line quote-props
    (item, i) => ({ 'time': start + i * resolution }));
}
function buildWhitespaceState(options, lastIndex) {
    return {
        _internal_start: Math.max(0, options.startTimeRange),
        _internal_end: Math.max(0, options.minimumTimeRange, lastIndex || 0),
        _internal_resolution: Math.max(1, options.baseResolution),
    };
}
const generateWhitespaceHash = ({ _internal_start: start, _internal_end: end, _internal_resolution: resolution, }) => `${start}~${end}~${resolution}`;
const defaultOptions = {
    yieldCurve: yieldChartOptionsDefaults,
    // and add sensible default options for yield charts which
    // are different from the usual defaults.
    timeScale: {
        ignoreWhitespaceIndices: true,
    },
    leftPriceScale: {
        visible: true,
    },
    rightPriceScale: {
        visible: false,
    },
    localization: {
        priceFormatter: (value) => {
            return value.toFixed(3) + '%';
        },
    },
};
const lineStyleDefaultOptionOverrides = {
    lastValueVisible: false,
    priceLineVisible: false,
};
class YieldChartApi extends ChartApi {
    constructor(container, options) {
        const fullOptions = merge(defaultOptions, options || {});
        const horzBehaviour = new YieldCurveHorzScaleBehavior();
        super(container, horzBehaviour, fullOptions);
        horzBehaviour.setOptions(this.options());
        this._initWhitespaceSeries();
    }
    addSeries(definition, options = {}, paneIndex = 0) {
        if (definition.isBuiltIn && ['Area', 'Line'].includes(definition.type) === false) {
            throw new Error('Yield curve only support Area and Line series');
        }
        const optionOverrides = {
            ...lineStyleDefaultOptionOverrides,
            ...options,
        };
        return super.addSeries(definition, optionOverrides, paneIndex);
    }
    _initWhitespaceSeries() {
        const horzBehaviour = this.horzBehaviour();
        const whiteSpaceSeries = this.addSeries(lineSeries);
        let currentWhitespaceHash;
        function updateWhitespace(lastIndex) {
            const newWhitespaceState = buildWhitespaceState(horzBehaviour.options().yieldCurve, lastIndex);
            const newWhitespaceHash = generateWhitespaceHash(newWhitespaceState);
            if (newWhitespaceHash !== currentWhitespaceHash) {
                currentWhitespaceHash = newWhitespaceHash;
                whiteSpaceSeries.setData(generateWhitespaceData(newWhitespaceState));
            }
        }
        updateWhitespace(0);
        horzBehaviour._internal_whitespaceInvalidated()._internal_subscribe(updateWhitespace);
    }
}

/**
 * Creates a yield curve chart with the specified options.
 *
 * A yield curve chart differs from the default chart type
 * in the following ways:
 * - Horizontal scale is linearly spaced, and defined in monthly
 * time duration units
 * - Whitespace is ignored for the crosshair and grid lines
 *
 * @param container - ID of HTML element or element itself
 * @param options - The yield chart options.
 * @returns An interface to the created chart
 */
function createYieldCurveChart(container, options) {
    const htmlElement = fetchHtmlElement(container);
    const chartApi = new YieldChartApi(htmlElement, options);
    return chartApi;
}

function markWithGreaterWeight(a, b) {
    return a.weight > b.weight ? a : b;
}
class HorzScaleBehaviorPrice {
    options() {
        return this._private__options;
    }
    setOptions(options) {
        this._private__options = options;
    }
    preprocessData(data) { }
    updateFormatter(options) {
        if (!this._private__options) {
            return;
        }
        this._private__options.localization = options;
    }
    createConverterToInternalObj(data) {
        return (price) => price;
    }
    key(internalItem) {
        return internalItem;
    }
    cacheKey(internalItem) {
        return internalItem;
    }
    convertHorzItemToInternal(item) {
        return item;
    }
    formatHorzItem(item) {
        return item.toFixed(this._private__precision());
    }
    formatTickmark(item, localizationOptions) {
        return item.time.toFixed(this._private__precision());
    }
    maxTickMarkWeight(marks) {
        return marks.reduce(markWithGreaterWeight, marks[0]).weight;
    }
    fillWeightsForPoints(sortedTimePoints, startIndex) {
        const priceWeight = (price) => {
            if (price === Math.ceil(price / 100) * 100) {
                return 8;
            }
            if (price === Math.ceil(price / 50) * 50) {
                return 7;
            }
            if (price === Math.ceil(price / 25) * 25) {
                return 6;
            }
            if (price === Math.ceil(price / 10) * 10) {
                return 5;
            }
            if (price === Math.ceil(price / 5) * 5) {
                return 4;
            }
            if (price === Math.ceil(price)) {
                return 3;
            }
            if (price * 2 === Math.ceil(price * 2)) {
                return 1;
            }
            return 0;
        };
        for (let index = startIndex; index < sortedTimePoints.length; ++index) {
            sortedTimePoints[index].timeWeight = priceWeight(sortedTimePoints[index].time);
        }
    }
    _private__precision() {
        return this._private__options.localization
            .precision;
    }
}

/**
 * Creates an 'options' chart with price values on the horizontal scale.
 *
 * This function is used to create a specialized chart type where the horizontal scale
 * represents price values instead of time. It's particularly useful for visualizing
 * option chains, price distributions, or any data where price is the primary x-axis metric.
 *
 * @param container - The DOM element or its id where the chart will be rendered.
 * @param options - Optional configuration options for the price chart.
 * @returns An instance of IChartApiBase configured for price-based horizontal scaling.
 */
function createOptionsChart(container, options) {
    return createChartEx(container, new HorzScaleBehaviorPrice(), options);
}

function finishStyledArea(baseLevelCoordinate, scope, style, areaFirstItem, newAreaFirstItem) {
    const { context, horizontalPixelRatio, verticalPixelRatio } = scope;
    context.lineTo(newAreaFirstItem._internal_x * horizontalPixelRatio, baseLevelCoordinate * verticalPixelRatio);
    context.lineTo(areaFirstItem._internal_x * horizontalPixelRatio, baseLevelCoordinate * verticalPixelRatio);
    context.closePath();
    context.fillStyle = style;
    context.fill();
}
class PaneRendererAreaBase extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._internal__data = null;
    }
    _internal_setData(data) {
        this._internal__data = data;
    }
    _internal__drawImpl(renderingScope) {
        if (this._internal__data === null) {
            return;
        }
        const { _internal_items: items, _internal_visibleRange: visibleRange, _internal_barWidth: barWidth, _internal_lineWidth: lineWidth, _internal_lineStyle: lineStyle, _internal_lineType: lineType } = this._internal__data;
        const baseLevelCoordinate = this._internal__data._internal_baseLevelCoordinate ??
            (this._internal__data._internal_invertFilledArea ? 0 : renderingScope.mediaSize.height);
        if (visibleRange === null) {
            return;
        }
        const ctx = renderingScope.context;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'round';
        ctx.lineWidth = lineWidth;
        setLineStyle(ctx, lineStyle);
        // walk lines with width=1 to have more accurate gradient's filling
        ctx.lineWidth = 1;
        walkLine(renderingScope, items, lineType, visibleRange, barWidth, this._internal__fillStyle.bind(this), finishStyledArea.bind(null, baseLevelCoordinate));
    }
}

class GradientStyleCache {
    // eslint-disable-next-line complexity
    _internal_get(scope, params) {
        const cachedParams = this._private__params;
        const { _internal_topColor1: topColor1, _internal_topColor2: topColor2, _internal_bottomColor1: bottomColor1, _internal_bottomColor2: bottomColor2, _internal_baseLevelCoordinate: baseLevelCoordinate, _internal_topCoordinate: topCoordinate, _internal_bottomCoordinate: bottomCoordinate, } = params;
        if (this._private__cachedValue === undefined ||
            cachedParams === undefined ||
            cachedParams._internal_topColor1 !== topColor1 ||
            cachedParams._internal_topColor2 !== topColor2 ||
            cachedParams._internal_bottomColor1 !== bottomColor1 ||
            cachedParams._internal_bottomColor2 !== bottomColor2 ||
            cachedParams._internal_baseLevelCoordinate !== baseLevelCoordinate ||
            cachedParams._internal_topCoordinate !== topCoordinate ||
            cachedParams._internal_bottomCoordinate !== bottomCoordinate) {
            const { verticalPixelRatio } = scope;
            const multiplier = baseLevelCoordinate || topCoordinate > 0 ? verticalPixelRatio : 1;
            const top = topCoordinate * multiplier;
            const bottom = bottomCoordinate === scope.bitmapSize.height ? bottomCoordinate : bottomCoordinate * multiplier;
            const baseline = (baseLevelCoordinate ?? 0) * multiplier;
            const gradient = scope.context.createLinearGradient(0, top, 0, bottom);
            gradient.addColorStop(0, topColor1);
            if (baseLevelCoordinate !== null && baseLevelCoordinate !== undefined) {
                const range = bottom - top;
                const baselineRatio = clamp(((baseline - top) / range), 0, 1);
                gradient.addColorStop(baselineRatio, topColor2);
                gradient.addColorStop(baselineRatio, bottomColor1);
            }
            gradient.addColorStop(1, bottomColor2);
            this._private__cachedValue = gradient;
            this._private__params = params;
        }
        return this._private__cachedValue;
    }
}

class PaneRendererBaselineArea extends PaneRendererAreaBase {
    constructor() {
        super(...arguments);
        this._private__fillCache = new GradientStyleCache();
    }
    _internal__fillStyle(renderingScope, item) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const data = this._internal__data;
        return this._private__fillCache._internal_get(renderingScope, {
            _internal_topColor1: item._internal_topFillColor1,
            _internal_topColor2: item._internal_topFillColor2,
            _internal_bottomColor1: item._internal_bottomFillColor1,
            _internal_bottomColor2: item._internal_bottomFillColor2,
            _internal_baseLevelCoordinate: data._internal_baseLevelCoordinate,
            _internal_topCoordinate: data._internal_topCoordinate ?? 0,
            _internal_bottomCoordinate: data._internal_bottomCoordinate ?? renderingScope.bitmapSize.height,
        });
    }
}

class PaneRendererBaselineLine extends PaneRendererLineBase {
    constructor() {
        super(...arguments);
        this._private__strokeCache = new GradientStyleCache();
    }
    _internal__strokeStyle(renderingScope, item) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const data = this._internal__data;
        return this._private__strokeCache._internal_get(renderingScope, {
            _internal_topColor1: item._internal_topLineColor,
            _internal_topColor2: item._internal_topLineColor,
            _internal_bottomColor1: item._internal_bottomLineColor,
            _internal_bottomColor2: item._internal_bottomLineColor,
            _internal_baseLevelCoordinate: data._internal_baseLevelCoordinate,
            _internal_topCoordinate: data._internal_topCoordinate ?? 0,
            _internal_bottomCoordinate: data._internal_bottomCoordinate ?? renderingScope.bitmapSize.height,
        });
    }
}

class SeriesBaselinePaneView extends LinePaneViewBase {
    constructor(series, model) {
        super(series, model);
        this._internal__renderer = new CompositeRenderer();
        this._private__baselineAreaRenderer = new PaneRendererBaselineArea();
        this._private__baselineLineRenderer = new PaneRendererBaselineLine();
        this._internal__renderer._internal_setRenderers([this._private__baselineAreaRenderer, this._private__baselineLineRenderer]);
    }
    _internal__createRawItem(time, price, colorer) {
        return {
            ...this._internal__createRawItemBase(time, price),
            ...colorer._internal_barStyle(time),
        };
    }
    _internal__prepareRendererData() {
        const firstValue = this._internal__series._internal_firstValue();
        if (firstValue === null) {
            return;
        }
        const options = this._internal__series._internal_options();
        const baseLevelCoordinate = this._internal__series._internal_priceScale()._internal_priceToCoordinate(options.baseValue.price, firstValue._internal_value);
        const barWidth = this._internal__model._internal_timeScale()._internal_barSpacing();
        if (this._internal__itemsVisibleRange === null || this._internal__items.length === 0) {
            return;
        }
        let topCoordinate;
        let bottomCoordinate;
        if (options.relativeGradient) {
            topCoordinate = this._internal__items[this._internal__itemsVisibleRange.from]._internal_y;
            bottomCoordinate = this._internal__items[this._internal__itemsVisibleRange.from]._internal_y;
            for (let i = this._internal__itemsVisibleRange.from; i < this._internal__itemsVisibleRange.to; i++) {
                const item = this._internal__items[i];
                if (item._internal_y < topCoordinate) {
                    topCoordinate = item._internal_y;
                }
                if (item._internal_y > bottomCoordinate) {
                    bottomCoordinate = item._internal_y;
                }
            }
        }
        this._private__baselineAreaRenderer._internal_setData({
            _internal_items: this._internal__items,
            _internal_lineWidth: options.lineWidth,
            _internal_lineStyle: options.lineStyle,
            _internal_lineType: options.lineType,
            _internal_baseLevelCoordinate: baseLevelCoordinate,
            _internal_topCoordinate: topCoordinate,
            _internal_bottomCoordinate: bottomCoordinate,
            _internal_invertFilledArea: false,
            _internal_visibleRange: this._internal__itemsVisibleRange,
            _internal_barWidth: barWidth,
        });
        this._private__baselineLineRenderer._internal_setData({
            _internal_items: this._internal__items,
            _internal_lineWidth: options.lineWidth,
            _internal_lineStyle: options.lineStyle,
            _internal_lineType: options.lineVisible ? options.lineType : undefined,
            _internal_pointMarkersRadius: options.pointMarkersVisible ? (options.pointMarkersRadius || options.lineWidth / 2 + 2) : undefined,
            _internal_baseLevelCoordinate: baseLevelCoordinate,
            _internal_topCoordinate: topCoordinate,
            _internal_bottomCoordinate: bottomCoordinate,
            _internal_visibleRange: this._internal__itemsVisibleRange,
            _internal_barWidth: barWidth,
        });
    }
}

const baselineStyleDefaults = {
    baseValue: {
        type: 'price',
        price: 0,
    },
    relativeGradient: false,
    topFillColor1: 'rgba(38, 166, 154, 0.28)',
    topFillColor2: 'rgba(38, 166, 154, 0.05)',
    topLineColor: 'rgba(38, 166, 154, 1)',
    bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
    bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
    bottomLineColor: 'rgba(239, 83, 80, 1)',
    lineWidth: 3,
    lineStyle: 0 /* LineStyle.Solid */,
    lineType: 0 /* LineType.Simple */,
    lineVisible: true,
    crosshairMarkerVisible: true,
    crosshairMarkerRadius: 4,
    crosshairMarkerBorderColor: '',
    crosshairMarkerBorderWidth: 2,
    crosshairMarkerBackgroundColor: '',
    lastPriceAnimation: 0 /* LastPriceAnimationMode.Disabled */,
    pointMarkersVisible: false,
};
const createPaneView$4 = (series, model) => new SeriesBaselinePaneView(series, model);
const createSeries$4 = () => {
    const definition = {
        type: 'Baseline',
        isBuiltIn: true,
        defaultOptions: baselineStyleDefaults,
        /**
         * @internal
         */
        _internal_createPaneView: createPaneView$4,
    };
    return definition;
};
const baselineSeries = createSeries$4();

class PaneRendererArea extends PaneRendererAreaBase {
    constructor() {
        super(...arguments);
        this._private__fillCache = new GradientStyleCache();
    }
    _internal__fillStyle(renderingScope, item) {
        return this._private__fillCache._internal_get(renderingScope, {
            _internal_topColor1: item._internal_topColor,
            _internal_topColor2: '',
            _internal_bottomColor1: '',
            _internal_bottomColor2: item._internal_bottomColor,
            _internal_topCoordinate: this._internal__data?._internal_topCoordinate ?? 0,
            _internal_bottomCoordinate: renderingScope.bitmapSize.height,
        });
    }
}

class SeriesAreaPaneView extends LinePaneViewBase {
    constructor(series, model) {
        super(series, model);
        this._internal__renderer = new CompositeRenderer();
        this._private__areaRenderer = new PaneRendererArea();
        this._private__lineRenderer = new PaneRendererLine();
        this._internal__renderer._internal_setRenderers([this._private__areaRenderer, this._private__lineRenderer]);
    }
    _internal__createRawItem(time, price, colorer) {
        return {
            ...this._internal__createRawItemBase(time, price),
            ...colorer._internal_barStyle(time),
        };
    }
    _internal__prepareRendererData() {
        const options = this._internal__series._internal_options();
        if (this._internal__itemsVisibleRange === null || this._internal__items.length === 0) {
            return;
        }
        let topCoordinate;
        if (options.relativeGradient) {
            topCoordinate = this._internal__items[this._internal__itemsVisibleRange.from]._internal_y;
            for (let i = this._internal__itemsVisibleRange.from; i < this._internal__itemsVisibleRange.to; i++) {
                const item = this._internal__items[i];
                if (item._internal_y < topCoordinate) {
                    topCoordinate = item._internal_y;
                }
            }
        }
        this._private__areaRenderer._internal_setData({
            _internal_lineType: options.lineType,
            _internal_items: this._internal__items,
            _internal_lineStyle: options.lineStyle,
            _internal_lineWidth: options.lineWidth,
            _internal_baseLevelCoordinate: null,
            _internal_topCoordinate: topCoordinate,
            _internal_invertFilledArea: options.invertFilledArea,
            _internal_visibleRange: this._internal__itemsVisibleRange,
            _internal_barWidth: this._internal__model._internal_timeScale()._internal_barSpacing(),
        });
        this._private__lineRenderer._internal_setData({
            _internal_lineType: options.lineVisible ? options.lineType : undefined,
            _internal_items: this._internal__items,
            _internal_lineStyle: options.lineStyle,
            _internal_lineWidth: options.lineWidth,
            _internal_visibleRange: this._internal__itemsVisibleRange,
            _internal_barWidth: this._internal__model._internal_timeScale()._internal_barSpacing(),
            _internal_pointMarkersRadius: options.pointMarkersVisible ? (options.pointMarkersRadius || options.lineWidth / 2 + 2) : undefined,
        });
    }
}

const areaStyleDefaults = {
    topColor: 'rgba( 46, 220, 135, 0.4)',
    bottomColor: 'rgba( 40, 221, 100, 0)',
    invertFilledArea: false,
    relativeGradient: false,
    lineColor: '#33D778',
    lineStyle: 0 /* LineStyle.Solid */,
    lineWidth: 3,
    lineType: 0 /* LineType.Simple */,
    lineVisible: true,
    crosshairMarkerVisible: true,
    crosshairMarkerRadius: 4,
    crosshairMarkerBorderColor: '',
    crosshairMarkerBorderWidth: 2,
    crosshairMarkerBackgroundColor: '',
    lastPriceAnimation: 0 /* LastPriceAnimationMode.Disabled */,
    pointMarkersVisible: false,
};
const createPaneView$3 = (series, model) => new SeriesAreaPaneView(series, model);
const createSeries$3 = () => {
    const definition = {
        type: 'Area',
        isBuiltIn: true,
        defaultOptions: areaStyleDefaults,
        /**
         * @internal
         */
        _internal_createPaneView: createPaneView$3,
    };
    return definition;
};
const areaSeries = createSeries$3();

function optimalBarWidth(barSpacing, pixelRatio) {
    return Math.floor(barSpacing * 0.3 * pixelRatio);
}
function optimalCandlestickWidth(barSpacing, pixelRatio) {
    const barSpacingSpecialCaseFrom = 2.5;
    const barSpacingSpecialCaseTo = 4;
    const barSpacingSpecialCaseCoeff = 3;
    if (barSpacing >= barSpacingSpecialCaseFrom && barSpacing <= barSpacingSpecialCaseTo) {
        return Math.floor(barSpacingSpecialCaseCoeff * pixelRatio);
    }
    // coeff should be 1 on small barspacing and go to 0.8 while groing bar spacing
    const barSpacingReducingCoeff = 0.2;
    const coeff = 1 - barSpacingReducingCoeff * Math.atan(Math.max(barSpacingSpecialCaseTo, barSpacing) - barSpacingSpecialCaseTo) / (Math.PI * 0.5);
    const res = Math.floor(barSpacing * coeff * pixelRatio);
    const scaledBarSpacing = Math.floor(barSpacing * pixelRatio);
    const optimal = Math.min(res, scaledBarSpacing);
    return Math.max(Math.floor(pixelRatio), optimal);
}

class PaneRendererBars extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._private__data = null;
        this._private__barWidth = 0;
        this._private__barLineWidth = 0;
    }
    _internal_setData(data) {
        this._private__data = data;
    }
    // eslint-disable-next-line complexity
    _internal__drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._private__data === null || this._private__data._internal_bars.length === 0 || this._private__data._internal_visibleRange === null) {
            return;
        }
        this._private__barWidth = this._private__calcBarWidth(horizontalPixelRatio);
        // grid and crosshair have line width = Math.floor(pixelRatio)
        // if this value is odd, we have to make bars' width odd
        // if this value is even, we have to make bars' width even
        // in order of keeping crosshair-over-bar drawing symmetric
        if (this._private__barWidth >= 2) {
            const lineWidth = Math.max(1, Math.floor(horizontalPixelRatio));
            if ((lineWidth % 2) !== (this._private__barWidth % 2)) {
                this._private__barWidth--;
            }
        }
        // if scale is compressed, bar could become less than 1 CSS pixel
        this._private__barLineWidth = this._private__data._internal_thinBars ? Math.min(this._private__barWidth, Math.floor(horizontalPixelRatio)) : this._private__barWidth;
        let prevColor = null;
        const drawOpenClose = this._private__barLineWidth <= this._private__barWidth && this._private__data._internal_barSpacing >= Math.floor(1.5 * horizontalPixelRatio);
        for (let i = this._private__data._internal_visibleRange.from; i < this._private__data._internal_visibleRange.to; ++i) {
            const bar = this._private__data._internal_bars[i];
            if (prevColor !== bar._internal_barColor) {
                ctx.fillStyle = bar._internal_barColor;
                prevColor = bar._internal_barColor;
            }
            const bodyWidthHalf = Math.floor(this._private__barLineWidth * 0.5);
            const bodyCenter = Math.round(bar._internal_x * horizontalPixelRatio);
            const bodyLeft = bodyCenter - bodyWidthHalf;
            const bodyWidth = this._private__barLineWidth;
            const bodyRight = bodyLeft + bodyWidth - 1;
            const high = Math.min(bar._internal_highY, bar._internal_lowY);
            const low = Math.max(bar._internal_highY, bar._internal_lowY);
            const bodyTop = Math.round(high * verticalPixelRatio) - bodyWidthHalf;
            const bodyBottom = Math.round(low * verticalPixelRatio) + bodyWidthHalf;
            const bodyHeight = Math.max((bodyBottom - bodyTop), this._private__barLineWidth);
            ctx.fillRect(bodyLeft, bodyTop, bodyWidth, bodyHeight);
            const sideWidth = Math.ceil(this._private__barWidth * 1.5);
            if (drawOpenClose) {
                if (this._private__data._internal_openVisible) {
                    const openLeft = bodyCenter - sideWidth;
                    let openTop = Math.max(bodyTop, Math.round(bar._internal_openY * verticalPixelRatio) - bodyWidthHalf);
                    let openBottom = openTop + bodyWidth - 1;
                    if (openBottom > bodyTop + bodyHeight - 1) {
                        openBottom = bodyTop + bodyHeight - 1;
                        openTop = openBottom - bodyWidth + 1;
                    }
                    ctx.fillRect(openLeft, openTop, bodyLeft - openLeft, openBottom - openTop + 1);
                }
                const closeRight = bodyCenter + sideWidth;
                let closeTop = Math.max(bodyTop, Math.round(bar._internal_closeY * verticalPixelRatio) - bodyWidthHalf);
                let closeBottom = closeTop + bodyWidth - 1;
                if (closeBottom > bodyTop + bodyHeight - 1) {
                    closeBottom = bodyTop + bodyHeight - 1;
                    closeTop = closeBottom - bodyWidth + 1;
                }
                ctx.fillRect(bodyRight + 1, closeTop, closeRight - bodyRight, closeBottom - closeTop + 1);
            }
        }
    }
    _private__calcBarWidth(pixelRatio) {
        const limit = Math.floor(pixelRatio);
        return Math.max(limit, Math.floor(optimalBarWidth(ensureNotNull(this._private__data)._internal_barSpacing, pixelRatio)));
    }
}

class BarsPaneViewBase extends SeriesPaneViewBase {
    constructor(series, model) {
        super(series, model, false);
    }
    _internal__convertToCoordinates(priceScale, timeScale, firstValue) {
        timeScale._internal_indexesToCoordinates(this._internal__items, undefinedIfNull(this._internal__itemsVisibleRange));
        priceScale._internal_barPricesToCoordinates(this._internal__items, firstValue, undefinedIfNull(this._internal__itemsVisibleRange));
    }
    _internal__createDefaultItem(time, bar, colorer) {
        return {
            _internal_time: time,
            _internal_open: bar._internal_value[0 /* PlotRowValueIndex.Open */],
            _internal_high: bar._internal_value[1 /* PlotRowValueIndex.High */],
            _internal_low: bar._internal_value[2 /* PlotRowValueIndex.Low */],
            _internal_close: bar._internal_value[3 /* PlotRowValueIndex.Close */],
            _internal_x: NaN,
            _internal_openY: NaN,
            _internal_highY: NaN,
            _internal_lowY: NaN,
            _internal_closeY: NaN,
        };
    }
    _internal__fillRawPoints() {
        const colorer = this._internal__series._internal_barColorer();
        this._internal__items = this._internal__series._internal_bars()._internal_rows().map((row) => this._internal__createRawItem(row._internal_index, row, colorer));
    }
}

class SeriesBarsPaneView extends BarsPaneViewBase {
    constructor() {
        super(...arguments);
        this._internal__renderer = new PaneRendererBars();
    }
    _internal__createRawItem(time, bar, colorer) {
        return {
            ...this._internal__createDefaultItem(time, bar, colorer),
            ...colorer._internal_barStyle(time),
        };
    }
    _internal__prepareRendererData() {
        const barStyleProps = this._internal__series._internal_options();
        this._internal__renderer._internal_setData({
            _internal_bars: this._internal__items,
            _internal_barSpacing: this._internal__model._internal_timeScale()._internal_barSpacing(),
            _internal_openVisible: barStyleProps.openVisible,
            _internal_thinBars: barStyleProps.thinBars,
            _internal_visibleRange: this._internal__itemsVisibleRange,
        });
    }
}

const barStyleDefaults = {
    upColor: '#26a69a',
    downColor: '#ef5350',
    openVisible: true,
    thinBars: true,
};
const createPaneView$2 = (series, model) => new SeriesBarsPaneView(series, model);
const createSeries$2 = () => {
    const definition = {
        type: 'Bar',
        isBuiltIn: true,
        defaultOptions: barStyleDefaults,
        /**
         * @internal
         */
        _internal_createPaneView: createPaneView$2,
    };
    return definition;
};
const barSeries = createSeries$2();

class PaneRendererCandlesticks extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._private__data = null;
        // scaled with pixelRatio
        this._private__barWidth = 0;
    }
    _internal_setData(data) {
        this._private__data = data;
    }
    _internal__drawImpl(renderingScope) {
        if (this._private__data === null || this._private__data._internal_bars.length === 0 || this._private__data._internal_visibleRange === null) {
            return;
        }
        const { horizontalPixelRatio } = renderingScope;
        // now we know pixelRatio and we could calculate barWidth effectively
        this._private__barWidth = optimalCandlestickWidth(this._private__data._internal_barSpacing, horizontalPixelRatio);
        // grid and crosshair have line width = Math.floor(pixelRatio)
        // if this value is odd, we have to make candlesticks' width odd
        // if this value is even, we have to make candlesticks' width even
        // in order of keeping crosshair-over-candlesticks drawing symmetric
        if (this._private__barWidth >= 2) {
            const wickWidth = Math.floor(horizontalPixelRatio);
            if ((wickWidth % 2) !== (this._private__barWidth % 2)) {
                this._private__barWidth--;
            }
        }
        const bars = this._private__data._internal_bars;
        if (this._private__data._internal_wickVisible) {
            this._private__drawWicks(renderingScope, bars, this._private__data._internal_visibleRange);
        }
        if (this._private__data._internal_borderVisible) {
            this._private__drawBorder(renderingScope, bars, this._private__data._internal_visibleRange);
        }
        const borderWidth = this._private__calculateBorderWidth(horizontalPixelRatio);
        if (!this._private__data._internal_borderVisible || this._private__barWidth > borderWidth * 2) {
            this._private__drawCandles(renderingScope, bars, this._private__data._internal_visibleRange);
        }
    }
    _private__drawWicks(renderingScope, bars, visibleRange) {
        if (this._private__data === null) {
            return;
        }
        const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;
        let prevWickColor = '';
        let wickWidth = Math.min(Math.floor(horizontalPixelRatio), Math.floor(this._private__data._internal_barSpacing * horizontalPixelRatio));
        wickWidth = Math.max(Math.floor(horizontalPixelRatio), Math.min(wickWidth, this._private__barWidth));
        const wickOffset = Math.floor(wickWidth * 0.5);
        let prevEdge = null;
        for (let i = visibleRange.from; i < visibleRange.to; i++) {
            const bar = bars[i];
            if (bar._internal_barWickColor !== prevWickColor) {
                ctx.fillStyle = bar._internal_barWickColor;
                prevWickColor = bar._internal_barWickColor;
            }
            const top = Math.round(Math.min(bar._internal_openY, bar._internal_closeY) * verticalPixelRatio);
            const bottom = Math.round(Math.max(bar._internal_openY, bar._internal_closeY) * verticalPixelRatio);
            const high = Math.round(bar._internal_highY * verticalPixelRatio);
            const low = Math.round(bar._internal_lowY * verticalPixelRatio);
            const scaledX = Math.round(horizontalPixelRatio * bar._internal_x);
            let left = scaledX - wickOffset;
            const right = left + wickWidth - 1;
            if (prevEdge !== null) {
                left = Math.max(prevEdge + 1, left);
                left = Math.min(left, right);
            }
            const width = right - left + 1;
            ctx.fillRect(left, high, width, top - high);
            ctx.fillRect(left, bottom + 1, width, low - bottom);
            prevEdge = right;
        }
    }
    _private__calculateBorderWidth(pixelRatio) {
        let borderWidth = Math.floor(1 /* Constants.BarBorderWidth */ * pixelRatio);
        if (this._private__barWidth <= 2 * borderWidth) {
            borderWidth = Math.floor((this._private__barWidth - 1) * 0.5);
        }
        const res = Math.max(Math.floor(pixelRatio), borderWidth);
        if (this._private__barWidth <= res * 2) {
            // do not draw bodies, restore original value
            return Math.max(Math.floor(pixelRatio), Math.floor(1 /* Constants.BarBorderWidth */ * pixelRatio));
        }
        return res;
    }
    _private__drawBorder(renderingScope, bars, visibleRange) {
        if (this._private__data === null) {
            return;
        }
        const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;
        let prevBorderColor = '';
        const borderWidth = this._private__calculateBorderWidth(horizontalPixelRatio);
        let prevEdge = null;
        for (let i = visibleRange.from; i < visibleRange.to; i++) {
            const bar = bars[i];
            if (bar._internal_barBorderColor !== prevBorderColor) {
                ctx.fillStyle = bar._internal_barBorderColor;
                prevBorderColor = bar._internal_barBorderColor;
            }
            let left = Math.round(bar._internal_x * horizontalPixelRatio) - Math.floor(this._private__barWidth * 0.5);
            // this is important to calculate right before patching left
            const right = left + this._private__barWidth - 1;
            const top = Math.round(Math.min(bar._internal_openY, bar._internal_closeY) * verticalPixelRatio);
            const bottom = Math.round(Math.max(bar._internal_openY, bar._internal_closeY) * verticalPixelRatio);
            if (prevEdge !== null) {
                left = Math.max(prevEdge + 1, left);
                left = Math.min(left, right);
            }
            if (this._private__data._internal_barSpacing * horizontalPixelRatio > 2 * borderWidth) {
                fillRectInnerBorder(ctx, left, top, right - left + 1, bottom - top + 1, borderWidth);
            }
            else {
                const width = right - left + 1;
                ctx.fillRect(left, top, width, bottom - top + 1);
            }
            prevEdge = right;
        }
    }
    _private__drawCandles(renderingScope, bars, visibleRange) {
        if (this._private__data === null) {
            return;
        }
        const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = renderingScope;
        let prevBarColor = '';
        const borderWidth = this._private__calculateBorderWidth(horizontalPixelRatio);
        for (let i = visibleRange.from; i < visibleRange.to; i++) {
            const bar = bars[i];
            let top = Math.round(Math.min(bar._internal_openY, bar._internal_closeY) * verticalPixelRatio);
            let bottom = Math.round(Math.max(bar._internal_openY, bar._internal_closeY) * verticalPixelRatio);
            let left = Math.round(bar._internal_x * horizontalPixelRatio) - Math.floor(this._private__barWidth * 0.5);
            let right = left + this._private__barWidth - 1;
            if (bar._internal_barColor !== prevBarColor) {
                const barColor = bar._internal_barColor;
                ctx.fillStyle = barColor;
                prevBarColor = barColor;
            }
            if (this._private__data._internal_borderVisible) {
                left += borderWidth;
                top += borderWidth;
                right -= borderWidth;
                bottom -= borderWidth;
            }
            if (top > bottom) {
                continue;
            }
            ctx.fillRect(left, top, right - left + 1, bottom - top + 1);
        }
    }
}

class SeriesCandlesticksPaneView extends BarsPaneViewBase {
    constructor() {
        super(...arguments);
        this._internal__renderer = new PaneRendererCandlesticks();
    }
    _internal__createRawItem(time, bar, colorer) {
        return {
            ...this._internal__createDefaultItem(time, bar, colorer),
            ...colorer._internal_barStyle(time),
        };
    }
    _internal__prepareRendererData() {
        const candlestickStyleProps = this._internal__series._internal_options();
        this._internal__renderer._internal_setData({
            _internal_bars: this._internal__items,
            _internal_barSpacing: this._internal__model._internal_timeScale()._internal_barSpacing(),
            _internal_wickVisible: candlestickStyleProps.wickVisible,
            _internal_borderVisible: candlestickStyleProps.borderVisible,
            _internal_visibleRange: this._internal__itemsVisibleRange,
        });
    }
}

const candlestickStyleDefaults = {
    upColor: '#26a69a',
    downColor: '#ef5350',
    wickVisible: true,
    borderVisible: true,
    borderColor: '#378658',
    borderUpColor: '#26a69a',
    borderDownColor: '#ef5350',
    wickColor: '#737375',
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
};
const createPaneView$1 = (series, model) => new SeriesCandlesticksPaneView(series, model);
const createSeries$1 = () => {
    const definition = {
        type: 'Candlestick',
        isBuiltIn: true,
        defaultOptions: candlestickStyleDefaults,
        /**
         * @internal
         */
        _internal_createPaneView: createPaneView$1,
    };
    return definition;
};
const candlestickSeries = createSeries$1();

const showSpacingMinimalBarWidth = 1;
const alignToMinimalWidthLimit = 4;
class PaneRendererHistogram extends BitmapCoordinatesPaneRenderer {
    constructor() {
        super(...arguments);
        this._private__data = null;
        this._private__precalculatedCache = [];
    }
    _internal_setData(data) {
        this._private__data = data;
        this._private__precalculatedCache = [];
    }
    _internal__drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._private__data === null || this._private__data._internal_items.length === 0 || this._private__data._internal_visibleRange === null) {
            return;
        }
        if (!this._private__precalculatedCache.length) {
            this._private__fillPrecalculatedCache(horizontalPixelRatio);
        }
        const tickWidth = Math.max(1, Math.floor(verticalPixelRatio));
        const histogramBase = Math.round((this._private__data._internal_histogramBase) * verticalPixelRatio);
        const topHistogramBase = histogramBase - Math.floor(tickWidth / 2);
        const bottomHistogramBase = topHistogramBase + tickWidth;
        for (let i = this._private__data._internal_visibleRange.from; i < this._private__data._internal_visibleRange.to; i++) {
            const item = this._private__data._internal_items[i];
            const current = this._private__precalculatedCache[i - this._private__data._internal_visibleRange.from];
            const y = Math.round(item._internal_y * verticalPixelRatio);
            ctx.fillStyle = item._internal_barColor;
            let top;
            let bottom;
            if (y <= topHistogramBase) {
                top = y;
                bottom = bottomHistogramBase;
            }
            else {
                top = topHistogramBase;
                bottom = y - Math.floor(tickWidth / 2) + tickWidth;
            }
            ctx.fillRect(current._internal_left, top, current._internal_right - current._internal_left + 1, bottom - top);
        }
    }
    // eslint-disable-next-line complexity
    _private__fillPrecalculatedCache(pixelRatio) {
        if (this._private__data === null || this._private__data._internal_items.length === 0 || this._private__data._internal_visibleRange === null) {
            this._private__precalculatedCache = [];
            return;
        }
        const spacing = Math.ceil(this._private__data._internal_barSpacing * pixelRatio) <= showSpacingMinimalBarWidth ? 0 : Math.max(1, Math.floor(pixelRatio));
        const columnWidth = Math.round(this._private__data._internal_barSpacing * pixelRatio) - spacing;
        this._private__precalculatedCache = new Array(this._private__data._internal_visibleRange.to - this._private__data._internal_visibleRange.from);
        for (let i = this._private__data._internal_visibleRange.from; i < this._private__data._internal_visibleRange.to; i++) {
            const item = this._private__data._internal_items[i];
            // force cast to avoid ensureDefined call
            const x = Math.round(item._internal_x * pixelRatio);
            let left;
            let right;
            if (columnWidth % 2) {
                const halfWidth = (columnWidth - 1) / 2;
                left = x - halfWidth;
                right = x + halfWidth;
            }
            else {
                // shift pixel to left
                const halfWidth = columnWidth / 2;
                left = x - halfWidth;
                right = x + halfWidth - 1;
            }
            this._private__precalculatedCache[i - this._private__data._internal_visibleRange.from] = {
                _internal_left: left,
                _internal_right: right,
                _internal_roundedCenter: x,
                _internal_center: (item._internal_x * pixelRatio),
                _internal_time: item._internal_time,
            };
        }
        // correct positions
        for (let i = this._private__data._internal_visibleRange.from + 1; i < this._private__data._internal_visibleRange.to; i++) {
            const current = this._private__precalculatedCache[i - this._private__data._internal_visibleRange.from];
            const prev = this._private__precalculatedCache[i - this._private__data._internal_visibleRange.from - 1];
            if (current._internal_time !== prev._internal_time + 1) {
                continue;
            }
            if (current._internal_left - prev._internal_right !== (spacing + 1)) {
                // have to align
                if (prev._internal_roundedCenter > prev._internal_center) {
                    // prev wasshifted to left, so add pixel to right
                    prev._internal_right = current._internal_left - spacing - 1;
                }
                else {
                    // extend current to left
                    current._internal_left = prev._internal_right + spacing + 1;
                }
            }
        }
        let minWidth = Math.ceil(this._private__data._internal_barSpacing * pixelRatio);
        for (let i = this._private__data._internal_visibleRange.from; i < this._private__data._internal_visibleRange.to; i++) {
            const current = this._private__precalculatedCache[i - this._private__data._internal_visibleRange.from];
            // this could happen if barspacing < 1
            if (current._internal_right < current._internal_left) {
                current._internal_right = current._internal_left;
            }
            const width = current._internal_right - current._internal_left + 1;
            minWidth = Math.min(width, minWidth);
        }
        if (spacing > 0 && minWidth < alignToMinimalWidthLimit) {
            for (let i = this._private__data._internal_visibleRange.from; i < this._private__data._internal_visibleRange.to; i++) {
                const current = this._private__precalculatedCache[i - this._private__data._internal_visibleRange.from];
                const width = current._internal_right - current._internal_left + 1;
                if (width > minWidth) {
                    if (current._internal_roundedCenter > current._internal_center) {
                        current._internal_right -= 1;
                    }
                    else {
                        current._internal_left += 1;
                    }
                }
            }
        }
    }
}

class SeriesHistogramPaneView extends LinePaneViewBase {
    constructor() {
        super(...arguments);
        this._internal__renderer = new PaneRendererHistogram();
    }
    _internal__createRawItem(time, price, colorer) {
        return {
            ...this._internal__createRawItemBase(time, price),
            ...colorer._internal_barStyle(time),
        };
    }
    _internal__prepareRendererData() {
        const data = {
            _internal_items: this._internal__items,
            _internal_barSpacing: this._internal__model._internal_timeScale()._internal_barSpacing(),
            _internal_visibleRange: this._internal__itemsVisibleRange,
            _internal_histogramBase: this._internal__series._internal_priceScale()._internal_priceToCoordinate(this._internal__series._internal_options().base, ensureNotNull(this._internal__series._internal_firstValue())._internal_value),
        };
        this._internal__renderer._internal_setData(data);
    }
}

const histogramStyleDefaults = {
    color: '#26a69a',
    base: 0,
};
const createPaneView = (series, model) => new SeriesHistogramPaneView(series, model);
const createSeries = () => {
    const definition = {
        type: 'Histogram',
        isBuiltIn: true,
        defaultOptions: histogramStyleDefaults,
        /**
         * @internal
         */
        _internal_createPaneView: createPaneView,
    };
    return definition;
};
const histogramSeries = createSeries();

class PanePrimitiveWrapper {
    constructor(pane, primitive) {
        this._private__pane = pane;
        this._private__primitive = primitive;
        this._private__attach();
    }
    detach() {
        this._private__pane.detachPrimitive(this._private__primitive);
    }
    getPane() {
        return this._private__pane;
    }
    applyOptions(options) {
        this._private__primitive._internal_applyOptions?.(options);
    }
    _private__attach() {
        this._private__pane.attachPrimitive(this._private__primitive);
    }
}

const textWatermarkOptionsDefaults = {
    visible: true,
    horzAlign: 'center',
    vertAlign: 'center',
    lines: [],
};
const textWatermarkLineOptionsDefaults = {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 48,
    fontFamily: defaultFontFamily,
    fontStyle: '',
    text: '',
};

class TextWatermarkRenderer {
    constructor(options) {
        this._private__metricsCache = new Map();
        this._private__data = options;
    }
    draw(target) {
        target.useMediaCoordinateSpace((scope) => {
            if (!this._private__data.visible) {
                return;
            }
            const { context: ctx, mediaSize } = scope;
            let textHeight = 0;
            for (const line of this._private__data.lines) {
                if (line.text.length === 0) {
                    continue;
                }
                ctx.font = line._internal_font;
                const textWidth = this._private__metrics(ctx, line.text);
                if (textWidth > mediaSize.width) {
                    line._internal_zoom = mediaSize.width / textWidth;
                }
                else {
                    line._internal_zoom = 1;
                }
                textHeight += line.lineHeight * line._internal_zoom;
            }
            let vertOffset = 0;
            switch (this._private__data.vertAlign) {
                case 'top':
                    vertOffset = 0;
                    break;
                case 'center':
                    vertOffset = Math.max((mediaSize.height - textHeight) / 2, 0);
                    break;
                case 'bottom':
                    vertOffset = Math.max(mediaSize.height - textHeight, 0);
                    break;
            }
            for (const line of this._private__data.lines) {
                ctx.save();
                ctx.fillStyle = line.color;
                let horzOffset = 0;
                switch (this._private__data.horzAlign) {
                    case 'left':
                        ctx.textAlign = 'left';
                        horzOffset = line.lineHeight / 2;
                        break;
                    case 'center':
                        ctx.textAlign = 'center';
                        horzOffset = mediaSize.width / 2;
                        break;
                    case 'right':
                        ctx.textAlign = 'right';
                        horzOffset = mediaSize.width - 1 - line.lineHeight / 2;
                        break;
                }
                ctx.translate(horzOffset, vertOffset);
                ctx.textBaseline = 'top';
                ctx.font = line._internal_font;
                ctx.scale(line._internal_zoom, line._internal_zoom);
                ctx.fillText(line.text, 0, line._internal_vertOffset);
                ctx.restore();
                vertOffset += line.lineHeight * line._internal_zoom;
            }
        });
    }
    _private__metrics(ctx, text) {
        const fontCache = this._private__fontCache(ctx.font);
        let result = fontCache.get(text);
        if (result === undefined) {
            result = ctx.measureText(text).width;
            fontCache.set(text, result);
        }
        return result;
    }
    _private__fontCache(font) {
        let fontCache = this._private__metricsCache.get(font);
        if (fontCache === undefined) {
            fontCache = new Map();
            this._private__metricsCache.set(font, fontCache);
        }
        return fontCache;
    }
}

class TextWatermarkPaneView {
    constructor(options) {
        this._private__options = buildRendererOptions$1(options);
    }
    _internal_update(options) {
        this._private__options = buildRendererOptions$1(options);
    }
    renderer() {
        return new TextWatermarkRenderer(this._private__options);
    }
}
function buildRendererLineOptions(lineOption) {
    return {
        ...lineOption,
        _internal_font: makeFont(lineOption.fontSize, lineOption.fontFamily, lineOption.fontStyle),
        lineHeight: lineOption.lineHeight || lineOption.fontSize * 1.2,
        _internal_vertOffset: 0,
        _internal_zoom: 0,
    };
}
function buildRendererOptions$1(options) {
    return {
        ...options,
        lines: options.lines.map(buildRendererLineOptions),
    };
}

function mergeLineOptionsWithDefaults(options) {
    return {
        ...textWatermarkLineOptionsDefaults,
        ...options,
    };
}
function mergeOptionsWithDefaults$1(options) {
    return {
        ...textWatermarkOptionsDefaults,
        ...options,
        lines: options.lines?.map(mergeLineOptionsWithDefaults) ?? [],
    };
}
class TextWatermark {
    constructor(options) {
        this._private__options = mergeOptionsWithDefaults$1(options);
        this._private__paneViews = [new TextWatermarkPaneView(this._private__options)];
    }
    updateAllViews() {
        this._private__paneViews.forEach((pw) => pw._internal_update(this._private__options));
    }
    paneViews() {
        return this._private__paneViews;
    }
    attached({ requestUpdate }) {
        this._internal_requestUpdate = requestUpdate;
    }
    detached() {
        this._internal_requestUpdate = undefined;
    }
    _internal_applyOptions(options) {
        this._private__options = mergeOptionsWithDefaults$1({ ...this._private__options, ...options });
        if (this._internal_requestUpdate) {
            this._internal_requestUpdate();
        }
    }
}
/**
 * Creates an image watermark.
 *
 * @param pane - Target pane.
 * @param options - Watermark options.
 *
 * @returns Image watermark wrapper.
 *
 * @example
 * ```js
 * import { createTextWatermark } from 'lightweight-charts';
 *
 * const firstPane = chart.panes()[0];
 * const textWatermark = createTextWatermark(firstPane, {
 * 	  horzAlign: 'center',
 * 	  vertAlign: 'center',
 * 	  lines: [
 * 	    {
 * 	      text: 'Hello',
 * 	      color: 'rgba(255,0,0,0.5)',
 * 	      fontSize: 100,
 * 	      fontStyle: 'bold',
 * 	    },
 * 	    {
 * 	      text: 'This is a text watermark',
 * 	      color: 'rgba(0,0,255,0.5)',
 * 	      fontSize: 50,
 * 	      fontStyle: 'italic',
 * 	      fontFamily: 'monospace',
 * 	    },
 * 	  ],
 * });
 * // to change options
 * textWatermark.applyOptions({ horzAlign: 'left' });
 * // to remove watermark from the pane
 * textWatermark.detach();
 * ```
 */
function createTextWatermark(pane, options) {
    return new PanePrimitiveWrapper(pane, new TextWatermark(options));
}

const imageWatermarkOptionsDefaults = {
    alpha: 1,
    padding: 0,
};

class ImageWatermarkRenderer {
    constructor(data) {
        this._private__data = data;
    }
    draw(target) {
        target.useMediaCoordinateSpace((scope) => {
            const ctx = scope.context;
            const pos = this._private__determinePlacement(this._private__data, scope.mediaSize);
            if (!pos || !this._private__data._internal_imgElement) {
                return;
            }
            ctx.globalAlpha = this._private__data.alpha ?? 1;
            ctx.drawImage(this._private__data._internal_imgElement, pos._internal_x, pos._internal_y, pos._internal_width, pos._internal_height);
        });
    }
    _private__determinePlacement(data, paneSize) {
        const { maxHeight, maxWidth, _internal_imgHeight: imgHeight, _internal_imgWidth: imgWidth, padding } = data;
        const plotCentreX = Math.round(paneSize.width / 2);
        const plotCentreY = Math.round(paneSize.height / 2);
        const paddingSize = padding ?? 0;
        let availableWidth = paneSize.width - 2 * paddingSize;
        let availableHeight = paneSize.height - 2 * paddingSize;
        if (maxHeight) {
            availableHeight = Math.min(availableHeight, maxHeight);
        }
        if (maxWidth) {
            availableWidth = Math.min(availableWidth, maxWidth);
        }
        const scaleX = availableWidth / imgWidth;
        const scaleY = availableHeight / imgHeight;
        const scaleToUse = Math.min(scaleX, scaleY);
        const drawWidth = imgWidth * scaleToUse;
        const drawHeight = imgHeight * scaleToUse;
        const x = plotCentreX - 0.5 * drawWidth;
        const y = plotCentreY - 0.5 * drawHeight;
        return {
            _internal_x: x,
            _internal_y: y,
            _internal_height: drawHeight,
            _internal_width: drawWidth,
        };
    }
}

class ImageWatermarkPaneView {
    constructor(options) {
        this._private__image = null;
        this._private__imageWidth = 0; // don't draw until loaded
        this._private__imageHeight = 0;
        this._private__options = options;
        this._private__rendererOptions = buildRendererOptions(this._private__options, this._private__image, this._private__imageWidth, this._private__imageHeight);
    }
    _internal_stateUpdate(state) {
        if (state._internal_imageWidth !== undefined) {
            this._private__imageWidth = state._internal_imageWidth;
        }
        if (state._internal_imageHeight !== undefined) {
            this._private__imageHeight = state._internal_imageHeight;
        }
        if (state._internal_image !== undefined) {
            this._private__image = state._internal_image;
        }
        this._internal_update();
    }
    _internal_optionsUpdate(options) {
        this._private__options = options;
        this._internal_update();
    }
    zOrder() {
        return 'bottom';
    }
    _internal_update() {
        this._private__rendererOptions = buildRendererOptions(this._private__options, this._private__image, this._private__imageWidth, this._private__imageHeight);
    }
    renderer() {
        return new ImageWatermarkRenderer(this._private__rendererOptions);
    }
}
function buildRendererOptions(options, imgElement, imgWidth, imgHeight) {
    return {
        ...options,
        _internal_imgElement: imgElement,
        _internal_imgWidth: imgWidth,
        _internal_imgHeight: imgHeight,
    };
}

function mergeOptionsWithDefaults(options) {
    return {
        ...imageWatermarkOptionsDefaults,
        ...options,
    };
}
class ImageWatermark {
    constructor(imageUrl, options) {
        this._private__imgElement = null;
        this._private__imageUrl = imageUrl;
        this._private__options = mergeOptionsWithDefaults(options);
        this._private__paneViews = [new ImageWatermarkPaneView(this._private__options)];
    }
    updateAllViews() {
        this._private__paneViews.forEach((pw) => pw._internal_update());
    }
    paneViews() {
        return this._private__paneViews;
    }
    attached(attachedParams) {
        const { requestUpdate } = attachedParams;
        this._private__requestUpdate = requestUpdate;
        this._private__imgElement = new Image();
        this._private__imgElement.onload = () => {
            const imageHeight = this._private__imgElement?.naturalHeight ?? 1;
            const imageWidth = this._private__imgElement?.naturalWidth ?? 1;
            this._private__paneViews.forEach((pv) => pv._internal_stateUpdate({
                _internal_imageHeight: imageHeight,
                _internal_imageWidth: imageWidth,
                _internal_image: this._private__imgElement,
            }));
            if (this._private__requestUpdate) {
                this._private__requestUpdate();
            }
        };
        this._private__imgElement.src = this._private__imageUrl;
    }
    detached() {
        this._private__requestUpdate = undefined;
        this._private__imgElement = null;
    }
    _internal_applyOptions(options) {
        this._private__options = mergeOptionsWithDefaults({ ...this._private__options, ...options });
        this._private__updateOptions();
        if (this._internal_requestUpdate) {
            this._internal_requestUpdate();
        }
    }
    _internal_requestUpdate() {
        if (this._private__requestUpdate) {
            this._private__requestUpdate();
        }
    }
    _private__updateOptions() {
        this._private__paneViews.forEach((pw) => pw._internal_optionsUpdate(this._private__options));
    }
}
/**
 * Creates an image watermark.
 *
 * @param pane - Target pane.
 * @param imageUrl - Image URL.
 * @param options - Watermark options.
 *
 * @returns Image watermark wrapper.
 *
 * @example
 * ```js
 * import { createImageWatermark } from 'lightweight-charts';
 *
 * const firstPane = chart.panes()[0];
 * const imageWatermark = createImageWatermark(firstPane, '/images/my-image.png', {
 *   alpha: 0.5,
 *   padding: 20,
 * });
 * // to change options
 * imageWatermark.applyOptions({ padding: 10 });
 * // to remove watermark from the pane
 * imageWatermark.detach();
 * ```
 */
function createImageWatermark(pane, imageUrl, options) {
    return new PanePrimitiveWrapper(pane, new ImageWatermark(imageUrl, options));
}

class SeriesPrimitiveAdapter {
    constructor(series, primitive) {
        this._internal__series = series;
        this._internal__primitive = primitive;
        this._private__attach();
    }
    detach() {
        this._internal__series.detachPrimitive(this._internal__primitive);
    }
    getSeries() {
        return this._internal__series;
    }
    applyOptions(options) {
        if (this._internal__primitive && this._internal__primitive._internal_applyOptions) {
            this._internal__primitive._internal_applyOptions(options);
        }
    }
    _private__attach() {
        this._internal__series.attachPrimitive(this._internal__primitive);
    }
}

function size(barSpacing, coeff) {
    const result = Math.min(Math.max(barSpacing, 12 /* Constants.MinShapeSize */), 30 /* Constants.MaxShapeSize */) * coeff;
    return ceiledOdd(result);
}
function shapeSize(shape, originalSize) {
    switch (shape) {
        case 'arrowDown':
        case 'arrowUp':
            return size(originalSize, 1);
        case 'circle':
            return size(originalSize, 0.8);
        case 'square':
            return size(originalSize, 0.7);
        case 'diamond':
            return size(originalSize, 0.7);
    }
    return size(originalSize, 1);
}
function calculateShapeHeight(barSpacing) {
    return ceiledEven(size(barSpacing, 1));
}
function shapeMargin(barSpacing) {
    return Math.max(size(barSpacing, 0.1), 3 /* Constants.MinShapeMargin */);
}
function calculateAdjustedMargin(margin, hasSide, hasInBar) {
    if (hasSide) {
        return margin;
    }
    else if (hasInBar) {
        return Math.ceil(margin / 2);
    }
    return 0;
}

function drawArrow(up, ctx, coords, size) {
    const arrowSize = shapeSize('arrowUp', size);
    const halfArrowSize = ((arrowSize - 1) / 2) * coords._internal_pixelRatio;
    const baseSize = ceiledOdd(size / 2);
    const halfBaseSize = ((baseSize - 1) / 2) * coords._internal_pixelRatio;
    ctx.beginPath();
    if (up) {
        ctx.moveTo(coords._internal_x - halfArrowSize, coords._internal_y);
        ctx.lineTo(coords._internal_x, coords._internal_y - halfArrowSize);
        ctx.lineTo(coords._internal_x + halfArrowSize, coords._internal_y);
        ctx.lineTo(coords._internal_x + halfBaseSize, coords._internal_y);
        ctx.lineTo(coords._internal_x + halfBaseSize, coords._internal_y + halfArrowSize);
        ctx.lineTo(coords._internal_x - halfBaseSize, coords._internal_y + halfArrowSize);
        ctx.lineTo(coords._internal_x - halfBaseSize, coords._internal_y);
    }
    else {
        ctx.moveTo(coords._internal_x - halfArrowSize, coords._internal_y);
        ctx.lineTo(coords._internal_x, coords._internal_y + halfArrowSize);
        ctx.lineTo(coords._internal_x + halfArrowSize, coords._internal_y);
        ctx.lineTo(coords._internal_x + halfBaseSize, coords._internal_y);
        ctx.lineTo(coords._internal_x + halfBaseSize, coords._internal_y - halfArrowSize);
        ctx.lineTo(coords._internal_x - halfBaseSize, coords._internal_y - halfArrowSize);
        ctx.lineTo(coords._internal_x - halfBaseSize, coords._internal_y);
    }
    ctx.fill();
}
function hitTestArrow(up, centerX, centerY, size, x, y) {
    const arrowSize = shapeSize('arrowUp', size);
    const halfArrowSize = (arrowSize - 1) / 2;
    const baseSize = ceiledOdd(size / 2);
    const halfBaseSize = (baseSize - 1) / 2;
    const triangleTolerance = 3;
    const rectTolerance = 2;
    const baseLeft = centerX - halfBaseSize - rectTolerance;
    const baseRight = centerX + halfBaseSize + rectTolerance;
    const baseTop = up ? centerY : centerY - halfArrowSize;
    const baseBottom = up ? centerY + halfArrowSize : centerY;
    if (x >= baseLeft && x <= baseRight &&
        y >= baseTop - rectTolerance && y <= baseBottom + rectTolerance) {
        return true;
    }
    const isInTriangleBounds = () => {
        const headLeft = centerX - halfArrowSize - triangleTolerance;
        const headRight = centerX + halfArrowSize + triangleTolerance;
        const headTop = up ? centerY - halfArrowSize - triangleTolerance : centerY;
        const headBottom = up ? centerY : centerY + halfArrowSize + triangleTolerance;
        if (x < headLeft || x > headRight ||
            y < headTop || y > headBottom) {
            return false;
        }
        const dx = Math.abs(x - centerX);
        const dy = up
            ? Math.abs(y - centerY) // up arrow
            : Math.abs(y - centerY); // down arrow
        return dy + triangleTolerance >= dx / 2;
    };
    return isInTriangleBounds();
}

function drawCircle(ctx, coords, size) {
    const circleSize = shapeSize('circle', size);
    const halfSize = (circleSize - 1) / 2;
    ctx.beginPath();
    ctx.arc(coords._internal_x, coords._internal_y, halfSize * coords._internal_pixelRatio, 0, 2 * Math.PI, false);
    ctx.fill();
}
function hitTestCircle(centerX, centerY, size, x, y) {
    const circleSize = shapeSize('circle', size);
    const tolerance = 2 + circleSize / 2;
    const xOffset = centerX - x;
    const yOffset = centerY - y;
    const dist = Math.sqrt(xOffset * xOffset + yOffset * yOffset);
    return dist <= tolerance;
}

function drawSquare(ctx, coords, size) {
    const squareSize = shapeSize('square', size);
    const halfSize = ((squareSize - 1) * coords._internal_pixelRatio) / 2;
    const left = coords._internal_x - halfSize;
    const top = coords._internal_y - halfSize;
    ctx.fillRect(left, top, squareSize * coords._internal_pixelRatio, squareSize * coords._internal_pixelRatio);
}
function hitTestSquare(centerX, centerY, size, x, y) {
    const squareSize = shapeSize('square', size);
    const halfSize = (squareSize - 1) / 2;
    const left = centerX - halfSize;
    const top = centerY - halfSize;
    return x >= left && x <= left + squareSize &&
        y >= top && y <= top + squareSize;
}

function drawText(ctx, text, x, y, horizontalPixelRatio, verticalPixelRatio) {
    ctx.save();
    ctx.scale(horizontalPixelRatio, verticalPixelRatio);
    ctx.fillText(text, x, y);
    ctx.restore();
}
function hitTestText(textX, textY, textWidth, textHeight, x, y) {
    const halfHeight = textHeight / 2;
    return x >= textX && x <= textX + textWidth &&
        y >= textY - halfHeight && y <= textY + halfHeight;
}

class SeriesMarkersRenderer {
    constructor() {
        this._private__data = null;
        this._private__textWidthCache = new TextWidthCache();
        this._private__fontSize = -1;
        this._private__fontFamily = '';
        this._private__font = '';
    }
    _internal_setData(data) {
        this._private__data = data;
    }
    _internal_setParams(fontSize, fontFamily) {
        if (this._private__fontSize !== fontSize || this._private__fontFamily !== fontFamily) {
            this._private__fontSize = fontSize;
            this._private__fontFamily = fontFamily;
            this._private__font = makeFont(fontSize, fontFamily);
            this._private__textWidthCache._internal_reset();
        }
    }
    _internal_hitTest(x, y) {
        if (this._private__data === null || this._private__data._internal_visibleRange === null) {
            return null;
        }
        for (let i = this._private__data._internal_visibleRange.from; i < this._private__data._internal_visibleRange.to; i++) {
            const item = this._private__data._internal_items[i];
            if (item && hitTestItem(item, x, y)) {
                return {
                    zOrder: 'normal',
                    externalId: item._internal_externalId ?? '',
                };
            }
        }
        return null;
    }
    draw(target) {
        target.useBitmapCoordinateSpace((scope) => {
            this._internal__drawImpl(scope);
        });
    }
    _internal__drawImpl({ context: ctx, horizontalPixelRatio, verticalPixelRatio }) {
        if (this._private__data === null || this._private__data._internal_visibleRange === null) {
            return;
        }
        ctx.textBaseline = 'middle';
        ctx.font = this._private__font;
        for (let index = this._private__data._internal_visibleRange.from; index < this._private__data._internal_visibleRange.to; index++) {
            const item = this._private__data._internal_items[index];
            if (item._internal_text !== undefined) {
                item._internal_text._internal_width = this._private__textWidthCache._internal_measureText(ctx, item._internal_text._internal_content);
                item._internal_text._internal_height = this._private__fontSize;
                item._internal_text._internal_x = item._internal_x - item._internal_text._internal_width / 2;
            }
            drawItem(item, ctx, horizontalPixelRatio, verticalPixelRatio);
        }
    }
}
function bitmapShapeItemCoordinates(item, horizontalPixelRatio, verticalPixelRatio) {
    const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
    const correction = (tickWidth % 2) / 2;
    return {
        _internal_x: Math.round(item._internal_x * horizontalPixelRatio) + correction,
        _internal_y: item._internal_y * verticalPixelRatio,
        _internal_pixelRatio: horizontalPixelRatio,
    };
}
function drawItem(item, ctx, horizontalPixelRatio, verticalPixelRatio) {
    ctx.fillStyle = item._internal_color;
    if (item._internal_text !== undefined) {
        drawText(ctx, item._internal_text._internal_content, item._internal_text._internal_x, item._internal_text._internal_y, horizontalPixelRatio, verticalPixelRatio);
    }
    drawShape(item, ctx, bitmapShapeItemCoordinates(item, horizontalPixelRatio, verticalPixelRatio));
}
function drawShape(item, ctx, coordinates) {
    if (item._internal_size === 0) {
        return;
    }
    switch (item._internal_shape) {
        case 'arrowDown':
            drawArrow(false, ctx, coordinates, item._internal_size);
            return;
        case 'arrowUp':
            drawArrow(true, ctx, coordinates, item._internal_size);
            return;
        case 'circle':
            drawCircle(ctx, coordinates, item._internal_size);
            return;
        case 'square':
            drawSquare(ctx, coordinates, item._internal_size);
            return;
        case 'diamond':
            // TODO: Implement diamond shape drawing
            drawSquare(ctx, coordinates, item._internal_size);
            return;
    }
    // This should never happen
    // eslint-disable-next-line no-console
    console.error(`Unknown marker shape: ${item._internal_shape}`);
}
function hitTestItem(item, x, y) {
    if (item._internal_text !== undefined && hitTestText(item._internal_text._internal_x, item._internal_text._internal_y, item._internal_text._internal_width, item._internal_text._internal_height, x, y)) {
        return true;
    }
    return hitTestShape(item, x, y);
}
function hitTestShape(item, x, y) {
    if (item._internal_size === 0) {
        return false;
    }
    switch (item._internal_shape) {
        case 'arrowDown':
            return hitTestArrow(false, item._internal_x, item._internal_y, item._internal_size, x, y);
        case 'arrowUp':
            return hitTestArrow(true, item._internal_x, item._internal_y, item._internal_size, x, y);
        case 'circle':
            return hitTestCircle(item._internal_x, item._internal_y, item._internal_size, x, y);
        case 'square':
        case 'diamond':
            return hitTestSquare(item._internal_x, item._internal_y, item._internal_size, x, y);
    }
    return false;
}

// Helper function to handle price-based positioning
function positionMarkerAtPrice(rendererItem, marker, y, series) {
    if (y === null) {
        return false;
    }
    const sizeMultiplier = isNumber(marker.size) ? Math.max(marker.size, 0) : 1;
    const shapeSize = calculateShapeHeight(sizeMultiplier);
    const halfSize = shapeSize / 2;
    rendererItem._internal_size = shapeSize;
    // Position the marker based on its position property and price
    switch (marker.position) {
        case 'atPriceTop':
            // Bottom of marker at price level
            rendererItem._internal_y = (y - halfSize);
            break;
        case 'atPriceBottom':
            // Top of marker at price level
            rendererItem._internal_y = (y + halfSize);
            break;
        case 'atPriceMiddle':
            // Center of marker at price level
            rendererItem._internal_y = y;
            break;
        default:
            // For other positions, just use the price coordinate
            rendererItem._internal_y = y;
    }
    if (rendererItem._internal_text !== undefined) {
        rendererItem._internal_text._internal_y = rendererItem._internal_y;
    }
    return true;
}
// Helper function to get prices from series data
function getPricesFromData(seriesData) {
    if (isOhlcData(seriesData)) {
        return {
            _internal_inBarPrice: seriesData.close,
            _internal_highPrice: seriesData.high,
            _internal_lowPrice: seriesData.low,
        };
    }
    else if (isValueData(seriesData)) {
        return {
            _internal_inBarPrice: seriesData.value,
            _internal_highPrice: seriesData.value,
            _internal_lowPrice: seriesData.value,
        };
    }
    return null;
}
// Helper function to position marker above bar
function positionAboveBar(series, highPrice, halfSize, offsets, shapeSize, shapeMargin) {
    const topCoordinate = series.priceToCoordinate(highPrice);
    if (topCoordinate === null) {
        return null;
    }
    const y = topCoordinate - halfSize - offsets._internal_aboveBar;
    offsets._internal_aboveBar += shapeSize + shapeMargin;
    return y;
}
// Helper function to position marker below bar
function positionBelowBar(series, lowPrice, halfSize, offsets, shapeSize, shapeMargin) {
    const bottomCoordinate = series.priceToCoordinate(lowPrice);
    if (bottomCoordinate === null) {
        return null;
    }
    const y = bottomCoordinate + halfSize + offsets._internal_belowBar;
    offsets._internal_belowBar += shapeSize + shapeMargin;
    return y;
}
// Helper function to position marker at price level
function positionAtPrice(series, price, position, halfSize) {
    const coordinate = series.priceToCoordinate(price);
    if (coordinate === null) {
        return null;
    }
    switch (position) {
        case 'atPriceTop':
            return coordinate - halfSize;
        case 'atPriceBottom':
            return coordinate + halfSize;
        case 'atPriceMiddle':
        case 'inBar':
        default:
            return coordinate;
    }
}
// Helper function to position marker on bar
function positionMarkerOnBar(rendererItem, marker, seriesData, offsets, shapeMargin, series) {
    // Get prices from series data
    const prices = getPricesFromData(seriesData);
    if (prices === null) {
        return;
    }
    const { _internal_inBarPrice: inBarPrice, _internal_highPrice: highPrice, _internal_lowPrice: lowPrice } = prices;
    const sizeMultiplier = isNumber(marker.size) ? Math.max(marker.size, 0) : 1;
    const shapeSize = calculateShapeHeight(sizeMultiplier);
    const halfSize = shapeSize / 2;
    rendererItem._internal_size = shapeSize;
    // Position the marker based on its position property
    let y = null;
    switch (marker.position) {
        case 'aboveBar':
            y = positionAboveBar(series, highPrice, halfSize, offsets, shapeSize, shapeMargin);
            break;
        case 'belowBar':
            y = positionBelowBar(series, lowPrice, halfSize, offsets, shapeSize, shapeMargin);
            break;
        default:
            y = positionAtPrice(series, inBarPrice, marker.position, halfSize);
            break;
    }
    if (y !== null) {
        rendererItem._internal_y = y;
        if (rendererItem._internal_text !== undefined) {
            rendererItem._internal_text._internal_y = y;
        }
    }
}
// eslint-disable-next-line max-params
function fillSizeAndY(rendererItem, marker, seriesData, offsets, textHeight, shapeMargin, series, chart) {
    // If marker has a price property, use it for exact Y-axis positioning
    if (marker.price !== undefined) {
        // Use the price property for positioning
        const y = series.priceToCoordinate(marker.price);
        if (positionMarkerAtPrice(rendererItem, marker, y)) {
            return;
        }
        // If price-to-coordinate conversion fails, fall back to default positioning
    }
    // Position based on bar data
    positionMarkerOnBar(rendererItem, marker, seriesData, offsets, shapeMargin, series);
}
function isValueData(data) {
    // eslint-disable-next-line no-restricted-syntax
    return 'value' in data && typeof data.value === 'number';
}
function isOhlcData(data) {
    // eslint-disable-next-line no-restricted-syntax
    return 'open' in data && 'high' in data && 'low' in data && 'close' in data;
}
class SeriesMarkersPaneView {
    constructor(series, chart) {
        this._private__markers = [];
        this._private__invalidated = true;
        this._private__dataInvalidated = true;
        this._private__renderer = new SeriesMarkersRenderer();
        this._private__series = series;
        this._private__chart = chart;
        this._private__data = {
            _internal_items: [],
            _internal_visibleRange: null,
        };
    }
    renderer() {
        if (!this._private__series.options().visible) {
            return null;
        }
        if (this._private__invalidated) {
            this._internal__makeValid();
        }
        const layout = this._private__chart.options()['layout'];
        this._private__renderer._internal_setParams(layout.fontSize, layout.fontFamily);
        this._private__renderer._internal_setData(this._private__data);
        return this._private__renderer;
    }
    _internal_setMarkers(markers) {
        this._private__markers = markers;
        this._internal_update('data');
    }
    _internal_update(updateType) {
        this._private__invalidated = true;
        if (updateType === 'data') {
            this._private__dataInvalidated = true;
        }
    }
    _internal__makeValid() {
        const timeScale = this._private__chart.timeScale();
        const seriesMarkers = this._private__markers;
        if (this._private__dataInvalidated) {
            this._private__data._internal_items = seriesMarkers.map((marker) => ({
                _internal_time: marker.time,
                _internal_x: 0,
                _internal_y: 0,
                _internal_size: 0,
                _internal_shape: marker.shape,
                _internal_color: marker.color,
                _internal_externalId: marker.id,
                _internal_internalId: marker._internal_internalId,
                _internal_text: undefined,
            }));
            this._private__dataInvalidated = false;
        }
        const layoutOptions = this._private__chart.options()['layout'];
        this._private__data._internal_visibleRange = null;
        const visibleBars = timeScale.getVisibleLogicalRange();
        if (visibleBars === null) {
            return;
        }
        const visibleBarsRange = new RangeImpl(Math.floor(visibleBars.from), Math.ceil(visibleBars.to));
        const firstValue = this._private__series.data()[0];
        if (firstValue === null) {
            return;
        }
        if (this._private__data._internal_items.length === 0) {
            return;
        }
        let prevTimeIndex = NaN;
        const shapeMargin$1 = shapeMargin(timeScale.options().barSpacing);
        const offsets = {
            _internal_aboveBar: shapeMargin$1,
            _internal_belowBar: shapeMargin$1,
        };
        this._private__data._internal_visibleRange = visibleTimedValues(this._private__data._internal_items, visibleBarsRange, true);
        for (let index = this._private__data._internal_visibleRange.from; index < this._private__data._internal_visibleRange.to; index++) {
            const marker = seriesMarkers[index];
            if (marker.time !== prevTimeIndex) {
                // new bar, reset stack counter
                offsets._internal_aboveBar = shapeMargin$1;
                offsets._internal_belowBar = shapeMargin$1;
                prevTimeIndex = marker.time;
            }
            const rendererItem = this._private__data._internal_items[index];
            rendererItem._internal_x = ensureNotNull(timeScale.logicalToCoordinate(marker.time));
            if (marker.text !== undefined && marker.text.length > 0) {
                rendererItem._internal_text = {
                    _internal_content: marker.text,
                    _internal_x: 0,
                    _internal_y: 0,
                    _internal_width: 0,
                    _internal_height: 0,
                };
            }
            const dataAt = ensureNotNull(this._private__series.dataByIndex(marker.time, -1));
            if (dataAt === null) {
                continue;
            }
            fillSizeAndY(rendererItem, marker, dataAt, offsets, layoutOptions.fontSize, shapeMargin$1, this._private__series, this._private__chart);
        }
        this._private__invalidated = false;
    }
}

class SeriesMarkersPrimitive {
    constructor() {
        this._private__paneView = null;
        this._private__markers = [];
        this._private__indexedMarkers = [];
        this._private__dataChangedHandler = null;
        this._private__series = null;
        this._private__chart = null;
        this._private__autoScaleMarginsInvalidated = true;
        this._private__autoScaleMargins = null;
        this._private__markersPositions = null;
        this._private__cachedBarSpacing = null;
    }
    attached(param) {
        this._private__recalculateMarkers();
        this._private__chart = param.chart;
        this._private__series = param.series;
        this._private__paneView = new SeriesMarkersPaneView(this._private__series, ensureNotNull(this._private__chart));
        this._private__requestUpdate = param.requestUpdate;
        this._private__series.subscribeDataChanged((scope) => this._private__onDataChanged(scope));
        this._internal_requestUpdate();
    }
    _internal_requestUpdate() {
        if (this._private__requestUpdate) {
            this._private__requestUpdate();
        }
    }
    detached() {
        if (this._private__series && this._private__dataChangedHandler) {
            this._private__series.unsubscribeDataChanged(this._private__dataChangedHandler);
        }
        this._private__chart = null;
        this._private__series = null;
        this._private__paneView = null;
        this._private__dataChangedHandler = null;
    }
    _internal_setMarkers(markers) {
        this._private__markers = markers;
        this._private__recalculateMarkers();
        this._private__autoScaleMarginsInvalidated = true;
        this._private__markersPositions = null;
        this._internal_requestUpdate();
    }
    _internal_markers() {
        return this._private__markers;
    }
    paneViews() {
        return this._private__paneView ? [this._private__paneView] : [];
    }
    updateAllViews() {
        this._private__updateAllViews();
    }
    hitTest(x, y) {
        if (this._private__paneView) {
            return this._private__paneView.renderer()?._internal_hitTest(x, y) ?? null;
        }
        return null;
    }
    autoscaleInfo(startTimePoint, endTimePoint) {
        if (this._private__paneView) {
            const margins = this._private__getAutoScaleMargins();
            if (margins) {
                return {
                    priceRange: null,
                    margins: margins,
                };
            }
        }
        return null;
    }
    _private__getAutoScaleMargins() {
        const chart = ensureNotNull(this._private__chart);
        const barSpacing = chart.timeScale().options().barSpacing;
        if (this._private__autoScaleMarginsInvalidated || barSpacing !== this._private__cachedBarSpacing) {
            this._private__cachedBarSpacing = barSpacing;
            if (this._private__markers.length > 0) {
                const shapeMargin$1 = shapeMargin(barSpacing);
                const marginValue = calculateShapeHeight(barSpacing) * 1.5 + shapeMargin$1 * 2;
                const positions = this._private__getMarkerPositions();
                this._private__autoScaleMargins = {
                    above: calculateAdjustedMargin(marginValue, positions.aboveBar, positions.inBar),
                    below: calculateAdjustedMargin(marginValue, positions.belowBar, positions.inBar),
                };
            }
            else {
                this._private__autoScaleMargins = null;
            }
            this._private__autoScaleMarginsInvalidated = false;
        }
        return this._private__autoScaleMargins;
    }
    _private__getMarkerPositions() {
        if (this._private__markersPositions === null) {
            const initialPositions = {
                inBar: false,
                aboveBar: false,
                belowBar: false,
                atPriceTop: false,
                atPriceBottom: false,
                atPriceMiddle: false,
            };
            this._private__markersPositions = this._private__markers.reduce((acc, marker) => {
                if (!acc[marker.position]) {
                    acc[marker.position] = true;
                }
                return acc;
            }, initialPositions);
        }
        return this._private__markersPositions;
    }
    _private__recalculateMarkers() {
        if (!this._private__chart || !this._private__series) {
            return;
        }
        const timeScale = this._private__chart.timeScale();
        if (timeScale.getVisibleLogicalRange() == null || !this._private__series || this._private__series?.data().length === 0) {
            this._private__indexedMarkers = [];
            return;
        }
        const seriesData = this._private__series?.data();
        const firstDataIndex = timeScale.timeToIndex(ensureNotNull(seriesData[0].time), true);
        this._private__indexedMarkers = this._private__markers.map((marker, index) => {
            const timePointIndex = timeScale.timeToIndex(marker.time, true);
            const searchMode = timePointIndex < firstDataIndex ? 1 /* MismatchDirection.NearestRight */ : -1 /* MismatchDirection.NearestLeft */;
            const seriesDataByIndex = ensureNotNull(this._private__series).dataByIndex(timePointIndex, searchMode);
            // @TODO think about should we expose the series' `.search()` method
            const finalIndex = timeScale.timeToIndex(ensureNotNull(seriesDataByIndex).time, false);
            return {
                time: finalIndex,
                position: marker.position,
                shape: marker.shape,
                color: marker.color,
                id: marker.id,
                _internal_internalId: index,
                text: marker.text,
                size: marker.size,
                _internal_originalTime: marker.time,
            };
        });
    }
    _private__updateAllViews(updateType) {
        if (this._private__paneView) {
            this._private__recalculateMarkers();
            this._private__paneView._internal_setMarkers(this._private__indexedMarkers);
            this._private__paneView._internal_update(updateType);
        }
    }
    _private__onDataChanged(scope) {
        this._internal_requestUpdate();
    }
}

class SeriesMarkersPrimitiveWrapper extends SeriesPrimitiveAdapter {
    constructor(series, primitive, markers) {
        super(series, primitive);
        if (markers) {
            this.setMarkers(markers);
        }
    }
    setMarkers(markers) {
        this._internal__primitive._internal_setMarkers(markers);
    }
    markers() {
        return this._internal__primitive._internal_markers();
    }
}
/**
 * A function to create a series markers primitive.
 *
 * @param series - The series to which the primitive will be attached.
 *
 * @param markers - An array of markers to be displayed on the series.
 *
 * @example
 * ```js
 * import { createSeriesMarkers } from 'lightweight-charts';
 *
 *	const seriesMarkers = createSeriesMarkers(
 *		series,
 *		[
 *			{
 *				color: 'green',
 *				position: 'inBar',
 * 				shape: 'arrowDown',
 *				time: 1556880900,
 *			},
 *		]
 *	);
 *  // and then you can modify the markers
 *  // set it to empty array to remove all markers
 *  seriesMarkers.setMarkers([]);
 *
 *  // `seriesMarkers.markers()` returns current markers
 * ```
 */
function createSeriesMarkers(series, markers) {
    const wrapper = new SeriesMarkersPrimitiveWrapper(series, new SeriesMarkersPrimitive());
    if (markers) {
        wrapper.setMarkers(markers);
    }
    return wrapper;
}

class ExpiringMarkerManager {
    constructor(updateCallback) {
        this._private__markers = new Map();
        this._private__updateCallback = updateCallback;
    }
    _internal_setMarker(marker, key, timeout) {
        this._internal_clearMarker(key);
        if (timeout !== undefined) {
            const timeoutId = window.setTimeout(() => {
                this._private__markers.delete(key);
                this._private__triggerUpdate();
            }, timeout);
            const markerWithTimeout = {
                ...marker,
                _internal_timeoutId: timeoutId,
                _internal_expiresAt: Date.now() + timeout,
            };
            this._private__markers.set(key, markerWithTimeout);
        }
        else {
            // For markers without timeout, we set timeoutId and expiresAt to undefined
            this._private__markers.set(key, {
                ...marker,
                _internal_timeoutId: undefined,
                _internal_expiresAt: undefined,
            });
        }
        this._private__triggerUpdate();
    }
    _internal_clearMarker(key) {
        const marker = this._private__markers.get(key);
        if (marker && marker._internal_timeoutId !== undefined) {
            window.clearTimeout(marker._internal_timeoutId);
        }
        this._private__markers.delete(key);
        this._private__triggerUpdate();
    }
    _internal_clearAllMarkers() {
        for (const [point] of this._private__markers) {
            this._internal_clearMarker(point);
        }
    }
    _internal_getMarkers() {
        const now = Date.now();
        const activeMarkers = [];
        for (const [time, marker] of this._private__markers) {
            if (!marker._internal_expiresAt || marker._internal_expiresAt > now) {
                activeMarkers.push({ time: marker.time, sign: marker.sign, value: marker.value });
            }
            else {
                this._internal_clearMarker(time);
            }
        }
        return activeMarkers;
    }
    _internal_setUpdateCallback(callback) {
        this._private__updateCallback = callback;
    }
    _private__triggerUpdate() {
        if (this._private__updateCallback) {
            this._private__updateCallback();
        }
    }
}

const upDownMarkersPluginOptionDefaults = {
    positiveColor: '#22AB94',
    negativeColor: '#F7525F',
    updateVisibilityDuration: 5000,
};

class MarkersPrimitiveRenderer {
    constructor(data, neutralColor, negativeColor, positiveColor) {
        this._private__data = data;
        this._private__neutralColor = neutralColor;
        this._private__negativeColor = negativeColor;
        this._private__positiveColor = positiveColor;
    }
    draw(target) {
        target.useBitmapCoordinateSpace((scope) => {
            const ctx = scope.context;
            const tickWidth = Math.max(1, Math.floor(scope.horizontalPixelRatio));
            const correction = (tickWidth % 2) / 2;
            const rad = 4 /* Constants.Radius */ * scope.verticalPixelRatio + correction;
            this._private__data.forEach((item) => {
                const centreX = Math.round(item._internal_x * scope.horizontalPixelRatio) + correction;
                ctx.beginPath();
                const color = this._private__getColor(item._internal_sign);
                ctx.fillStyle = color;
                ctx.arc(centreX, item._internal_y * scope.verticalPixelRatio, rad, 0, 2 * Math.PI, false);
                ctx.fill();
                if (item._internal_sign) {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = Math.floor(2 /* Constants.ArrowLineWidth */ * scope.horizontalPixelRatio);
                    ctx.beginPath();
                    ctx.moveTo((item._internal_x - 4.7 /* Constants.ArrowSize */) * scope.horizontalPixelRatio + correction, (item._internal_y - 7 /* Constants.ArrowOffset */ * item._internal_sign) *
                        scope.verticalPixelRatio);
                    ctx.lineTo(item._internal_x * scope.horizontalPixelRatio + correction, (item._internal_y -
                        7 /* Constants.ArrowOffset */ * item._internal_sign -
                        7 /* Constants.ArrowOffset */ * item._internal_sign * 0.5 /* Constants.VerticalScale */) *
                        scope.verticalPixelRatio);
                    ctx.lineTo((item._internal_x + 4.7 /* Constants.ArrowSize */) * scope.horizontalPixelRatio + correction, (item._internal_y - 7 /* Constants.ArrowOffset */ * item._internal_sign) *
                        scope.verticalPixelRatio);
                    ctx.stroke();
                }
            });
        });
    }
    _private__getColor(sign) {
        if (sign === 0) {
            return this._private__neutralColor;
        }
        return sign > 0 ? this._private__positiveColor : this._private__negativeColor;
    }
}

function isAreaStyleOptions(opts, seriesType) {
    return seriesType === 'Area';
}
function getNeutralColor(opts, seriesType) {
    if (isAreaStyleOptions(opts, seriesType)) {
        return opts.lineColor;
    }
    return opts.color;
}
class MarkersPrimitivePaneView {
    constructor(series, timeScale, options) {
        this._private__data = [];
        this._private__series = series;
        this._private__timeScale = timeScale;
        this._private__options = options;
    }
    _internal_update(markers) {
        this._private__data = markers.map((marker) => {
            const y = this._private__series.priceToCoordinate(marker.value);
            if (y === null) {
                return null;
            }
            const x = ensureNotNull(this._private__timeScale.timeToCoordinate(marker.time));
            return {
                _internal_x: x,
                _internal_y: y,
                _internal_sign: marker.sign,
            };
        })
            .filter(notNull);
    }
    renderer() {
        const options = this._private__series.options();
        const seriesType = this._private__series.seriesType();
        const neutralColor = getNeutralColor(options, seriesType);
        return new MarkersPrimitiveRenderer(this._private__data, neutralColor, this._private__options.negativeColor, this._private__options.positiveColor);
    }
}

function isLineData(item, type) {
    return type === 'Line' || type === 'Area';
}
class UpDownMarkersPrimitive {
    constructor(options) {
        this._private__chart = undefined;
        this._private__series = undefined;
        this._private__paneViews = [];
        this._private__horzScaleBehavior = null;
        this._private__managedDataPoints = new Map();
        this._private__markersManager = new ExpiringMarkerManager(() => this._internal_requestUpdate());
        this._private__options = {
            ...upDownMarkersPluginOptionDefaults,
            ...options,
        };
    }
    _internal_applyOptions(options) {
        this._private__options = {
            ...this._private__options,
            ...options,
        };
        this._internal_requestUpdate();
    }
    _internal_setMarkers(markers) {
        this._private__markersManager._internal_clearAllMarkers();
        const horzBehaviour = this._private__horzScaleBehavior;
        if (!horzBehaviour) {
            return;
        }
        markers.forEach((marker) => {
            this._private__markersManager._internal_setMarker(marker, horzBehaviour.key(marker.time));
        });
    }
    _internal_markers() {
        return this._private__markersManager._internal_getMarkers();
    }
    _internal_requestUpdate() {
        this._private__requestUpdate?.();
    }
    attached(params) {
        const { chart, series, requestUpdate, horzScaleBehavior, } = params;
        this._private__chart = chart;
        this._private__series = series;
        this._private__horzScaleBehavior = horzScaleBehavior;
        const seriesType = this._private__series.seriesType();
        if (seriesType !== 'Area' && seriesType !== 'Line') {
            throw new Error('UpDownMarkersPrimitive is only supported for Area and Line series types');
        }
        this._private__paneViews = [
            new MarkersPrimitivePaneView(this._private__series, this._private__chart.timeScale(), this._private__options),
        ];
        this._private__requestUpdate = requestUpdate;
        this._internal_requestUpdate();
    }
    detached() {
        this._private__chart = undefined;
        this._private__series = undefined;
        this._private__requestUpdate = undefined;
    }
    _internal_chart() {
        return ensureDefined(this._private__chart);
    }
    _internal_series() {
        return ensureDefined(this._private__series);
    }
    updateAllViews() {
        this._private__paneViews.forEach((pw) => pw._internal_update(this._internal_markers()));
    }
    paneViews() {
        return this._private__paneViews;
    }
    _internal_setData(data) {
        if (!this._private__series) {
            throw new Error('Primitive not attached to series');
        }
        const seriesType = this._private__series.seriesType();
        this._private__managedDataPoints.clear();
        const horzBehaviour = this._private__horzScaleBehavior;
        if (horzBehaviour) {
            data.forEach((d) => {
                if (isFulfilledData(d) && isLineData(d, seriesType)) {
                    this._private__managedDataPoints.set(horzBehaviour.key(d.time), d.value);
                }
            });
        }
        ensureDefined(this._private__series).setData(data);
    }
    _internal_update(data, historicalUpdate) {
        if (!this._private__series || !this._private__horzScaleBehavior) {
            throw new Error('Primitive not attached to series');
        }
        const seriesType = this._private__series.seriesType();
        const horzKey = this._private__horzScaleBehavior.key(data.time);
        if (isWhitespaceData(data)) {
            this._private__managedDataPoints.delete(horzKey);
        }
        if (isFulfilledData(data) && isLineData(data, seriesType)) {
            const existingPrice = this._private__managedDataPoints.get(horzKey);
            if (existingPrice) {
                this._private__markersManager._internal_setMarker({
                    time: data.time,
                    value: data.value,
                    sign: getSign(data.value, existingPrice),
                }, horzKey, this._private__options.updateVisibilityDuration);
            }
        }
        ensureDefined(this._private__series).update(data, historicalUpdate);
    }
    _internal_clearMarkers() {
        this._private__markersManager._internal_clearAllMarkers();
    }
}
function getSign(newValue, oldValue) {
    if (newValue === oldValue) {
        return 0;
    }
    return newValue - oldValue > 0 ? 1 : -1;
}

class SeriesUpDownMarkerPrimitiveWrapper extends SeriesPrimitiveAdapter {
    setData(data) {
        return this._internal__primitive._internal_setData(data);
    }
    update(data, historicalUpdate) {
        return this._internal__primitive._internal_update(data, historicalUpdate);
    }
    markers() {
        return this._internal__primitive._internal_markers();
    }
    setMarkers(markers) {
        return this._internal__primitive._internal_setMarkers(markers);
    }
    clearMarkers() {
        return this._internal__primitive._internal_clearMarkers();
    }
}
/**
 * Creates and attaches the Series Up Down Markers Plugin.
 *
 * @param series - Series to which attach the Up Down Markers Plugin
 * @param options - options for the Up Down Markers Plugin
 *
 * @returns Api for Series Up Down Marker Plugin. {@link ISeriesUpDownMarkerPluginApi}
 *
 * @example
 * ```js
 * import { createUpDownMarkers, createChart, LineSeries } from 'lightweight-charts';
 *
 * const chart = createChart('container');
 * const lineSeries = chart.addSeries(LineSeries);
 * const upDownMarkers = createUpDownMarkers(lineSeries, {
 *     positiveColor: '#22AB94',
 *     negativeColor: '#F7525F',
 *     updateVisibilityDuration: 5000,
 * });
 * // to add some data
 * upDownMarkers.setData(
 *     [
 *         { time: '2020-02-02', value: 12.34 },
 *         //... more line series data
 *     ]
 * );
 * // ... Update some values
 * upDownMarkers.update({ time: '2020-02-02', value: 13.54 }, true);
 * // to remove plugin from the series
 * upDownMarkers.detach();
 * ```
 */
function createUpDownMarkers(series, options = {}) {
    const wrapper = new SeriesUpDownMarkerPrimitiveWrapper(series, new UpDownMarkersPrimitive(options));
    return wrapper;
}

// Store markers for each series
const seriesMarkers = new WeakMap();
/**
 * Adds a marker at a specific price position
 * @param series - The series to add the marker to
 * @param marker - The marker configuration
 */
function addPricePositionMarker(series, marker) {
    // Get existing markers or initialize empty array
    const markers = seriesMarkers.get(series) || [];
    // Create complete marker with defaults
    const completeMarker = {
        time: marker.time,
        price: marker.price,
        position: marker.position || 'inBar',
        shape: marker.shape || 'circle',
        color: marker.color || '#FF0000',
        id: marker.id || `marker-${Date.now()}`,
        text: marker.text,
        size: marker.size,
    };
    markers.push(completeMarker);
    // Update stored markers
    seriesMarkers.set(series, markers);
    // Update markers on the series
    updateSeriesMarkers(series, markers);
}
/**
 * Removes a marker with the specified ID
 * @param series - The series to remove the marker from
 * @param markerId - The ID of the marker to remove
 */
function removePricePositionMarker(series, markerId) {
    // Get existing markers
    const markers = seriesMarkers.get(series) || [];
    // Filter out the marker with the specified ID
    const filteredMarkers = markers.filter((m) => m.id !== markerId);
    // Update stored markers
    seriesMarkers.set(series, filteredMarkers);
    // Convert to series markers and update
    updateSeriesMarkers(series, filteredMarkers);
}
/**
 * Updates an existing marker with new properties
 * @param series - The series containing the marker
 * @param markerId - The ID of the marker to update
 * @param marker - The new marker properties
 */
function updatePricePositionMarker(series, markerId, marker) {
    // Get existing markers
    const markers = seriesMarkers.get(series) || [];
    // Find the marker with the specified ID
    const index = markers.findIndex((m) => m.id === markerId);
    if (index !== -1) {
        // Update the marker
        markers[index] = { ...markers[index], ...marker };
        // Update stored markers
        seriesMarkers.set(series, markers);
        // Convert to series markers and update
        updateSeriesMarkers(series, markers);
    }
}
/**
 * Gets all price position markers for the specified series
 * @param series - The series to get markers from
 * @returns An array of price position markers
 */
function getPricePositionMarkers(series) {
    return seriesMarkers.get(series) || [];
}
/**
 * Removes all price position markers from the specified series
 * @param series - The series to clear markers from
 */
function clearPricePositionMarkers(series) {
    // Clear stored markers
    seriesMarkers.set(series, []);
    // Clear markers on the series
    createSeriesMarkers(series, []);
}
/**
 * Helper function to update series markers
 */
function updateSeriesMarkers(series, markers) {
    // Convert price position markers to series markers
    const seriesMarkersData = markers.map((m) => ({
        time: m.time,
        position: m.position,
        shape: m.shape,
        color: m.color,
        id: m.id,
        text: m.text,
        size: m.size,
    }));
    // Update markers on the series
    createSeriesMarkers(series, seriesMarkersData);
}

/// <reference types="_build-time-constants" />
const customSeriesDefaultOptions = {
    ...seriesOptionsDefaults,
    ...customStyleDefaults$1,
};
/**
 * Returns the current version as a string. For example `'3.3.0'`.
 */
function version() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return process.env._internal_version || 'x.y.z-SNAPSHOT';
}

export { areaSeries as AreaSeries, barSeries as BarSeries, baselineSeries as BaselineSeries, candlestickSeries as CandlestickSeries, ColorType, CrosshairMode, histogramSeries as HistogramSeries, LastPriceAnimationMode, lineSeries as LineSeries, LineStyle, LineType, MismatchDirection, PriceLineSource, PriceScaleMode, TickMarkType, TrackingModeExitMode, addPricePositionMarker, clearPricePositionMarkers, createChart, createChartEx, createImageWatermark, createOptionsChart, createSeriesMarkers, createTextWatermark, createUpDownMarkers, createYieldCurveChart, customSeriesDefaultOptions, defaultHorzScaleBehavior, getPricePositionMarkers, isBusinessDay, isUTCTimestamp, removePricePositionMarker, updatePricePositionMarker, version };
