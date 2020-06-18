import { isRunningOnClientSide } from '../helpers/assertions';

function checkTouchEvents(): boolean {
	if ('ontouchstart' in window) {
		return true;
	}

	// tslint:disable-next-line:no-any
	return Boolean((window as any).DocumentTouch && document instanceof (window as any).DocumentTouch);
}

function getMobileTouch(): boolean {
	const touch = !!navigator.maxTouchPoints || !!navigator.msMaxTouchPoints || checkTouchEvents();

	return 'onorientationchange' in window && touch;
}

export const mobileTouch = isRunningOnClientSide && getMobileTouch();

function getIsMobile(): boolean {
	// actually we shouldn't check that values
	// we even don't need to know what browser/UA/etc is (in almost all cases, except special ones)
	// so, in MouseEventHandler/PaneWidget we should check what event happened (touch or mouse)
	// not check current UA to detect "mobile" device
	const android = /Android/i.test(navigator.userAgent);
	const iOS = /iPhone|iPad|iPod|AppleWebKit.+Mobile/i.test(navigator.userAgent);

	return android || iOS;
}

export const isMobile = isRunningOnClientSide && getIsMobile();
