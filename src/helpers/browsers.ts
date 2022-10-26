import { isRunningOnClientSide } from './is-running-on-client-side';

export function isFF(): boolean {
	if (!isRunningOnClientSide) {
		return false;
	}
	return window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}

export function isIOS(): boolean {
	if (!isRunningOnClientSide) {
		return false;
	}
	// eslint-disable-next-line deprecation/deprecation
	return /iPhone|iPad|iPod/.test(window.navigator.platform);
}

export function isChrome(): boolean {
	if (!isRunningOnClientSide) {
		return false;
	}
	return window.chrome !== undefined;
}

// Determine whether the browser is Chromium based and running on windows.
export function userAgentWindowsChromium(): boolean {
	if (
		!navigator.userAgentData ||
		navigator.userAgentData.platform !== 'Windows'
	) {
		return false;
	}
	return navigator.userAgentData.brands.some(
		(brand: UADataBrand) => {
			return brand.brand.includes('Chromium');
		}
	);
}
