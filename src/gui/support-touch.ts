import { isRunningOnClientSide } from '../helpers/is-running-on-client-side';

function checkTouchEvents(): boolean {
	if (!isRunningOnClientSide) {
		return false;
	}

	// eslint-disable-next-line no-restricted-syntax
	if ('ontouchstart' in window) {
		return true;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
	return Boolean((window as any).DocumentTouch && document instanceof (window as any).DocumentTouch);
}

function getMobileTouch(): boolean {
	if (!isRunningOnClientSide) {
		return false;
	}

	const touch = !!navigator.maxTouchPoints || !!navigator.msMaxTouchPoints || checkTouchEvents();

	// eslint-disable-next-line no-restricted-syntax
	return 'onorientationchange' in window && touch;
}

export const mobileTouch = getMobileTouch();

function getIsMobile(): boolean {
	if (!isRunningOnClientSide) {
		return false;
	}

	// actually we shouldn't check that values
	// we even don't need to know what browser/UA/etc is (in almost all cases, except special ones)
	// so, in MouseEventHandler/PaneWidget we should check what event happened (touch or mouse)
	// not check current UA to detect "mobile" device
	const android = /Android/i.test(navigator.userAgent);
	const iOS = /iPhone|iPad|iPod|AppleWebKit.+Mobile/i.test(navigator.userAgent);

	return android || iOS;
}

export const isMobile = getIsMobile();
