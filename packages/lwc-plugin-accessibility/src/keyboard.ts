/** The navigation / announcement actions the plugin's key handling can trigger. */
export type AccessibilityCommand =
	| 'nextPoint'
	| 'previousPoint'
	| 'nextSeries'
	| 'previousSeries'
	| 'pageForward'
	| 'pageBack'
	| 'firstPoint'
	| 'lastPoint'
	| 'zoomIn'
	| 'zoomOut'
	| 'summary'
	| 'help';

/**
 * `KeyboardEvent.key` → command. `PageUp` moves forward in time and `PageDown`
 * back, following the ARIA slider convention that `PageUp` increases the value.
 * The `=` / `_` aliases mean `+` / `-` work without holding Shift.
 */
const keyCommands = new Map<string, AccessibilityCommand>([
	['ArrowRight', 'nextPoint'],
	['ArrowLeft', 'previousPoint'],
	['ArrowUp', 'previousSeries'],
	['ArrowDown', 'nextSeries'],
	['PageUp', 'pageForward'],
	['PageDown', 'pageBack'],
	['Home', 'firstPoint'],
	['End', 'lastPoint'],
	['+', 'zoomIn'],
	['=', 'zoomIn'],
	['-', 'zoomOut'],
	['_', 'zoomOut'],
	['Enter', 'summary'],
	[' ', 'summary'],
	['h', 'help'],
	['H', 'help'],
]);

/** The command a key press maps to, or `null` when the plugin ignores the key. */
export function commandForKey(key: string): AccessibilityCommand | null {
	return keyCommands.get(key) ?? null;
}
