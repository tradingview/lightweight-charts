"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChromiumBased = exports.isWindows = exports.isChrome = exports.isIOS = exports.isFF = void 0;
const is_running_on_client_side_1 = require("./is-running-on-client-side");
function isFF() {
    if (!is_running_on_client_side_1.isRunningOnClientSide) {
        return false;
    }
    return window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}
exports.isFF = isFF;
function isIOS() {
    if (!is_running_on_client_side_1.isRunningOnClientSide) {
        return false;
    }
    // eslint-disable-next-line deprecation/deprecation
    return /iPhone|iPad|iPod/.test(window.navigator.platform);
}
exports.isIOS = isIOS;
function isChrome() {
    if (!is_running_on_client_side_1.isRunningOnClientSide) {
        return false;
    }
    return window.chrome !== undefined;
}
exports.isChrome = isChrome;
// Determine whether the browser is running on windows.
function isWindows() {
    var _a;
    if (!is_running_on_client_side_1.isRunningOnClientSide) {
        return false;
    }
    // more accurate if available
    if ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.userAgentData) === null || _a === void 0 ? void 0 : _a.platform) {
        return navigator.userAgentData.platform === 'Windows';
    }
    return navigator.userAgent.toLowerCase().indexOf('win') >= 0;
}
exports.isWindows = isWindows;
// Determine whether the browser is Chromium based.
function isChromiumBased() {
    if (!is_running_on_client_side_1.isRunningOnClientSide) {
        return false;
    }
    if (!navigator.userAgentData) {
        return false;
    }
    return navigator.userAgentData.brands.some((brand) => {
        return brand.brand.includes('Chromium');
    });
}
exports.isChromiumBased = isChromiumBased;
