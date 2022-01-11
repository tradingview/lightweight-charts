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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
	const touch = !!navigator.maxTouchPoints || !!(navigator as any).msMaxTouchPoints || checkTouchEvents();

	// eslint-disable-next-line no-restricted-syntax
	return 'onorientationchange' in window && touch;
}

export const mobileTouch = getMobileTouch();
