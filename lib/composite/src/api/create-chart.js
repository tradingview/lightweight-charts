"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChart = exports.createChartEx = void 0;
const assertions_1 = require("../helpers/assertions");
const strict_type_checks_1 = require("../helpers/strict-type-checks");
const horz_scale_behavior_time_1 = require("../model/horz-scale-behavior-time/horz-scale-behavior-time");
const chart_api_1 = require("./chart-api");
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
    let htmlElement;
    if ((0, strict_type_checks_1.isString)(container)) {
        const element = document.getElementById(container);
        (0, assertions_1.assert)(element !== null, `Cannot find element in DOM with id=${container}`);
        htmlElement = element;
    }
    else {
        htmlElement = container;
    }
    const res = new chart_api_1.ChartApi(htmlElement, horzScaleBehavior, options);
    horzScaleBehavior.setOptions(res.options());
    return res;
}
exports.createChartEx = createChartEx;
/**
 * This function is the simplified main entry point of the Lightweight Charting Library with time points for the horizontal scale.
 *
 * @param container - ID of HTML element or element itself
 * @param options - Any subset of options to be applied at start.
 * @returns An interface to the created chart
 */
function createChart(container, options) {
    return createChartEx(container, new horz_scale_behavior_time_1.HorzScaleBehaviorTime(), horz_scale_behavior_time_1.HorzScaleBehaviorTime.applyDefaults(options));
}
exports.createChart = createChart;
