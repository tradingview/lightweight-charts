function checkTouchEvents(): boolean {
	if ('ontouchstart' in window) {
		return true;
	}

	// tslint:disable-next-line:no-any
	return Boolean((window as any).DocumentTouch && document instanceof (window as any).DocumentTouch);
}

const touch = !!navigator.maxTouchPoints || !!navigator.msMaxTouchPoints || checkTouchEvents();
export const mobileTouch = 'onorientationchange' in window && touch;

const android = /Android/i.test(navigator.userAgent);
const blackBerry = /BlackBerry/i.test(navigator.userAgent);
const iOS = /iPhone|iPad|iPod|AppleWebKit.+Mobile/i.test(navigator.userAgent);
const opera = /Opera Mini/i.test(navigator.userAgent);

export const mobile = {
	android,
	blackBerry,
	iOS,
	opera,
	any: android || blackBerry || iOS || opera,
};
