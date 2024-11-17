import { assert } from '../helpers/assertions';
import { isString } from '../helpers/strict-type-checks';
import { HorzScaleBehaviorTime } from '../model/horz-scale-behavior-time/horz-scale-behavior-time';
import { ChartApi } from './chart-api';
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
export function createChartEx(container, horzScaleBehavior, options) {
    let htmlElement;
    if (isString(container)) {
        const element = document.getElementById(container);
        assert(element !== null, `Cannot find element in DOM with id=${container}`);
        htmlElement = element;
    }
    else {
        htmlElement = container;
    }
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
export function createChart(container, options) {
    return createChartEx(container, new HorzScaleBehaviorTime(), HorzScaleBehaviorTime.applyDefaults(options));
}
/**
 * Provides the default implementation of the horizontal scale (time-based) that can be used as a base for extending the horizontal scale with custom behavior.
 * This allows for the introduction of custom functionality without re-implementing the entire {@link IHorzScaleBehavior}&lt;{@link Time}&gt; interface.
 *
 * For further details, refer to the {@link createChartEx} chart constructor method.
 *
 * @returns An uninitialized class implementing the {@link IHorzScaleBehavior}&lt;{@link Time}&gt; interface
 */
export function defaultHorzScaleBehavior() {
    return HorzScaleBehaviorTime;
}
