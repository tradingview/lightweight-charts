import { Coordinate } from './coordinate';

/**
 * The TouchMouseEventData interface represents events that occur due to the user interacting with a
 * pointing device (such as a mouse).
 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent | MouseEvent}
 */
export interface TouchMouseEventData {
	/**
	 * The X coordinate of the mouse pointer in local (DOM content) coordinates.
	 */
	readonly clientX: Coordinate;
	/**
	 * The Y coordinate of the mouse pointer in local (DOM content) coordinates.
	 */
	readonly clientY: Coordinate;
	/**
	 * The X coordinate of the mouse pointer relative to the whole document.
	 */
	readonly pageX: Coordinate;
	/**
	 * The Y coordinate of the mouse pointer relative to the whole document.
	 */
	readonly pageY: Coordinate;
	/**
	 * The X coordinate of the mouse pointer in global (screen) coordinates.
	 */
	readonly screenX: Coordinate;
	/**
	 * The Y coordinate of the mouse pointer in global (screen) coordinates.
	 */
	readonly screenY: Coordinate;
	/**
	 * The X coordinate of the mouse pointer relative to the chart / price axis / time axis canvas element.
	 */
	readonly localX: Coordinate;
	/**
	 * The Y coordinate of the mouse pointer relative to the chart / price axis / time axis canvas element.
	 */
	readonly localY: Coordinate;

	/**
	 * Returns a boolean value that is true if the Ctrl key was active when the key event was generated.
	 */
	readonly ctrlKey: boolean;
	/**
	 * Returns a boolean value that is true if the Alt (Option or ⌥ on macOS) key was active when the
	 * key event was generated.
	 */
	readonly altKey: boolean;
	/**
	 * Returns a boolean value that is true if the Shift key was active when the key event was generated.
	 */
	readonly shiftKey: boolean;
	/**
	 * Returns a boolean value that is true if the Meta key (on Mac keyboards, the ⌘ Command key; on
	 * Windows keyboards, the Windows key (⊞)) was active when the key event was generated.
	 */
	readonly metaKey: boolean;
}
