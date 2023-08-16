/**
 * This type should be used when you need to save result of the setTimeout/setInterval functions.
 * It makes the compilation with non-composite project happy.
 */
type TimerId = ReturnType<typeof setTimeout>;

/**
 * The type declares compile-time constants for mouse buttons.
 * e.button values for MouseEvents.
 * It's NOT e.buttons (with s)!
 */
declare const enum MouseEventButton {
	Left = 0,
	Middle = 1,
	Right = 2,
	Fourth = 3,
	Fifth = 4,
}
