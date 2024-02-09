"use strict";
/// <reference types="_build-time-constants" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.version = exports.createChartEx = exports.createChart = exports.customSeriesDefaultOptions = exports.TickMarkType = exports.isUTCTimestamp = exports.isBusinessDay = exports.ColorType = exports.LastPriceAnimationMode = exports.PriceLineSource = exports.PriceScaleMode = exports.MismatchDirection = exports.CrosshairMode = exports.TrackingModeExitMode = exports.LineType = exports.LineStyle = void 0;
const series_options_defaults_1 = require("./api/options/series-options-defaults");
var draw_line_1 = require("./renderers/draw-line");
Object.defineProperty(exports, "LineStyle", { enumerable: true, get: function () { return draw_line_1.LineStyle; } });
Object.defineProperty(exports, "LineType", { enumerable: true, get: function () { return draw_line_1.LineType; } });
var chart_model_1 = require("./model/chart-model");
Object.defineProperty(exports, "TrackingModeExitMode", { enumerable: true, get: function () { return chart_model_1.TrackingModeExitMode; } });
var crosshair_1 = require("./model/crosshair");
Object.defineProperty(exports, "CrosshairMode", { enumerable: true, get: function () { return crosshair_1.CrosshairMode; } });
var plot_list_1 = require("./model/plot-list");
Object.defineProperty(exports, "MismatchDirection", { enumerable: true, get: function () { return plot_list_1.MismatchDirection; } });
var price_scale_1 = require("./model/price-scale");
Object.defineProperty(exports, "PriceScaleMode", { enumerable: true, get: function () { return price_scale_1.PriceScaleMode; } });
var series_options_1 = require("./model/series-options");
Object.defineProperty(exports, "PriceLineSource", { enumerable: true, get: function () { return series_options_1.PriceLineSource; } });
Object.defineProperty(exports, "LastPriceAnimationMode", { enumerable: true, get: function () { return series_options_1.LastPriceAnimationMode; } });
var layout_options_1 = require("./model/layout-options");
Object.defineProperty(exports, "ColorType", { enumerable: true, get: function () { return layout_options_1.ColorType; } });
var types_1 = require("./model/horz-scale-behavior-time/types");
Object.defineProperty(exports, "isBusinessDay", { enumerable: true, get: function () { return types_1.isBusinessDay; } });
Object.defineProperty(exports, "isUTCTimestamp", { enumerable: true, get: function () { return types_1.isUTCTimestamp; } });
var types_2 = require("./model/horz-scale-behavior-time/types");
Object.defineProperty(exports, "TickMarkType", { enumerable: true, get: function () { return types_2.TickMarkType; } });
exports.customSeriesDefaultOptions = Object.assign(Object.assign({}, series_options_defaults_1.seriesOptionsDefaults), series_options_defaults_1.customStyleDefaults);
var create_chart_1 = require("./api/create-chart");
Object.defineProperty(exports, "createChart", { enumerable: true, get: function () { return create_chart_1.createChart; } });
Object.defineProperty(exports, "createChartEx", { enumerable: true, get: function () { return create_chart_1.createChartEx; } });
/**
 * Returns the current version as a string. For example `'3.3.0'`.
 */
function version() {
    return process.env.BUILD_VERSION;
}
exports.version = version;
