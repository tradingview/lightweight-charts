/** Height of the add button, in CSS pixels. Its width is one pixel more. */
export const BUTTON_HEIGHT = 21;

/** Width of the add button, in CSS pixels. */
export const BUTTON_WIDTH = BUTTON_HEIGHT + 1;

/**
 * How close to the right edge of the pane, in CSS pixels, the pointer brings
 * the button up: twice its height, so the button is there before the pointer
 * reaches it.
 */
export const SHOW_DISTANCE = BUTTON_HEIGHT * 2;

/** A rectangle in media coordinates. */
export interface Rect {
	left: number;
	top: number;
	width: number;
	height: number;
}

/** The add button against the right edge of a pane `paneWidth` wide, centered on `y`. */
export function buttonRect(paneWidth: number, y: number): Rect {
	return {
		left: paneWidth - BUTTON_WIDTH,
		top: y - BUTTON_HEIGHT / 2,
		width: BUTTON_WIDTH,
		height: BUTTON_HEIGHT,
	};
}

/** Whether a point is inside a rectangle, its edges included. */
export function isInRect(rect: Rect, x: number, y: number): boolean {
	return x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height;
}

/**
 * The `maxLines` option as a count: rounded down and at least `1`, or
 * `Infinity`, no limit, for a value that is not a number.
 */
export function lineLimit(maxLines: unknown): number {
	if (typeof maxLines !== 'number' || Number.isNaN(maxLines)) {
		return Infinity;
	}
	return Math.max(1, Math.floor(maxLines));
}
