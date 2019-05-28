function checkTouchEvents(): boolean {
	if ('ontouchstart' in window) {
		return true;
	}

	// tslint:disable-next-line:no-any
	return Boolean((window as any).DocumentTouch && document instanceof (window as any).DocumentTouch);
}

const touch = !!navigator.maxTouchPoints || !!navigator.msMaxTouchPoints || checkTouchEvents();
export const mobileTouch = 'onorientationchange' in window && touch;
