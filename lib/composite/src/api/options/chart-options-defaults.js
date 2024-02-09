"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chartOptionsDefaults = void 0;
const is_running_on_client_side_1 = require("../../helpers/is-running-on-client-side");
const crosshair_options_defaults_1 = require("./crosshair-options-defaults");
const grid_options_defaults_1 = require("./grid-options-defaults");
const layout_options_defaults_1 = require("./layout-options-defaults");
const price_scale_options_defaults_1 = require("./price-scale-options-defaults");
const time_scale_options_defaults_1 = require("./time-scale-options-defaults");
const watermark_options_defaults_1 = require("./watermark-options-defaults");
function chartOptionsDefaults() {
    return {
        width: 0,
        height: 0,
        autoSize: false,
        layout: layout_options_defaults_1.layoutOptionsDefaults,
        crosshair: crosshair_options_defaults_1.crosshairOptionsDefaults,
        grid: grid_options_defaults_1.gridOptionsDefaults,
        overlayPriceScales: Object.assign({}, price_scale_options_defaults_1.priceScaleOptionsDefaults),
        leftPriceScale: Object.assign(Object.assign({}, price_scale_options_defaults_1.priceScaleOptionsDefaults), { visible: false }),
        rightPriceScale: Object.assign(Object.assign({}, price_scale_options_defaults_1.priceScaleOptionsDefaults), { visible: true }),
        timeScale: time_scale_options_defaults_1.timeScaleOptionsDefaults,
        watermark: watermark_options_defaults_1.watermarkOptionsDefaults,
        localization: {
            locale: is_running_on_client_side_1.isRunningOnClientSide ? navigator.language : '',
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
exports.chartOptionsDefaults = chartOptionsDefaults;
