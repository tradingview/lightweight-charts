import { MouseWheelModifierKey } from '../model/chart-model';

export type ModifierKeysState = Pick<WheelEvent, 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>;

/**
 * Checks whether the modifier key required for mouse wheel scaling is pressed.
 * Returns `true` when no modifier key is required.
 */
export function isMouseWheelModifierPressed(event: ModifierKeysState, key: MouseWheelModifierKey | null | undefined): boolean {
	switch (key) {
		case 'ctrl':
			return event.ctrlKey;
		case 'alt':
			return event.altKey;
		case 'shift':
			return event.shiftKey;
		case 'meta':
			return event.metaKey;
		default:
			return true;
	}
}
