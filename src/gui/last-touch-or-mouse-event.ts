import { mobileTouch } from './support-touch';

let lastEventIsTouchValue = mobileTouch;

export function lastEventIsTouch(): boolean {
	return lastEventIsTouchValue;
}

export function lastEventIsMouse(): boolean {
	return lastEventIsTouchValue;
}

// This setter is called from MouseEventHandler on any touch / mouse event.
// Currently we use MouseEventHandler on PaneWidget / PriceAxisWidget / TimeAxisWidget (almost the whole chart).
// There are places where we should know what is type of the last mouse or touch event
// and where MouseEventHandler is not used, for example ChartWidget / CrosshairPaneView.
export function setLastEventIsTouch(isTouch: boolean): void {
	lastEventIsTouchValue = isTouch;
}
