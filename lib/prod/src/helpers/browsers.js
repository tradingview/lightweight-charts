import { isRunningOnClientSide } from './is-running-on-client-side';
export function isFF() {
    if (!isRunningOnClientSide) {
        return false;
    }
    return window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}
export function isIOS() {
    if (!isRunningOnClientSide) {
        return false;
    }
    // eslint-disable-next-line deprecation/deprecation
    return /iPhone|iPad|iPod/.test(window.navigator.platform);
}
export function isChrome() {
    if (!isRunningOnClientSide) {
        return false;
    }
    return window.chrome !== undefined;
}
// Determine whether the browser is running on windows.
export function isWindows() {
    var _a;
    if (!isRunningOnClientSide) {
        return false;
    }
    // more accurate if available
    if ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.userAgentData) === null || _a === void 0 ? void 0 : _a.platform) {
        return navigator.userAgentData.platform === 'Windows';
    }
    return navigator.userAgent.toLowerCase().indexOf('win') >= 0;
}
// Determine whether the browser is Chromium based.
export function isChromiumBased() {
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
