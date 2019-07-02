function checkTouchEvents(): boolean {
	if ('ontouchstart' in window) {
		return true;
	}

	// tslint:disable-next-line:no-any
	return Boolean((window as any).DocumentTouch && document instanceof (window as any).DocumentTouch);
}

const touch = !!navigator.maxTouchPoints || !!navigator.msMaxTouchPoints || checkTouchEvents();
export const mobileTouch = 'onorientationchange' in window && touch;

// actually we shouldn't check that values
// we even don't need to know what browser/UA/etc is (in almost all cases, except special ones)
// so, in MouseEventHandler/PaneWidget we should check what event happened (touch or mouse)
// not check current UA to detect "mobile" device
const android = /Android/i.test(navigator.userAgent);
const iOS = /iPhone|iPad|iPod|AppleWebKit.+Mobile/i.test(navigator.userAgent);
export const isMobile = android || iOS;
