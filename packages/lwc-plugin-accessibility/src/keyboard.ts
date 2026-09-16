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
	| 'help'
	| 'viewAsTable'
	| 'closePanels';

/**
 * A key press reduced to what the command lookup needs, so the mapping can be
 * used (and tested) without a real `KeyboardEvent`.
 */
export interface KeyPress {
	/** `KeyboardEvent.key` – layout dependent. */
	key: string;
	/** `KeyboardEvent.code` – the physical key, so letters work on any layout. */
	code?: string;
	shiftKey?: boolean;
}

/**
 * Custom key → command mapping, merged onto the built-in one. A key is either a
 * `KeyboardEvent.key` (`'ArrowRight'`, `'t'`) or a `KeyboardEvent.code`
 * (`'KeyT'`); `null` removes a built-in binding.
 */
export type KeyBindings = Readonly<Record<string, AccessibilityCommand | null>>;

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
	['t', 'viewAsTable'],
	['T', 'viewAsTable'],
	['Escape', 'closePanels'],
]);

/**
 * `KeyboardEvent.code` → command for the letter shortcuts, so they keep working
 * on layouts where the physical H / T keys produce another character (Cyrillic,
 * Greek, Dvorak…). Only consulted when `key` matched nothing.
 */
const codeCommands = new Map<string, AccessibilityCommand>([
	['KeyH', 'help'],
	['KeyT', 'viewAsTable'],
]);

/** The binding for `name` in a caller-supplied map, `undefined` when it has none. */
function customBinding(
	bindings: KeyBindings | undefined,
	name: string | undefined
): AccessibilityCommand | null | undefined {
	if (bindings === undefined || name === undefined || !Object.prototype.hasOwnProperty.call(bindings, name)) {
		return undefined;
	}
	return bindings[name];
}

/**
 * The command a key press maps to, or `null` when the plugin ignores it.
 * `keyBindings` entries win over the built-ins, and a `null` there removes a
 * built-in binding.
 *
 * Shift combinations are left to the platform (screen readers use them heavily)
 * unless the shifted key is itself a printable character, so `Shift` + `=` still
 * types `+` and zooms in.
 */
export function commandForKey(press: KeyPress, bindings?: KeyBindings): AccessibilityCommand | null {
	if (press.shiftKey === true && press.key.length !== 1) {
		return null;
	}
	const byKey = customBinding(bindings, press.key);
	if (byKey !== undefined) {
		return byKey;
	}
	const byCode = customBinding(bindings, press.code);
	if (byCode !== undefined) {
		return byCode;
	}
	const builtIn = keyCommands.get(press.key);
	if (builtIn !== undefined) {
		return builtIn;
	}
	return (press.code !== undefined ? codeCommands.get(press.code) : undefined) ?? null;
}
