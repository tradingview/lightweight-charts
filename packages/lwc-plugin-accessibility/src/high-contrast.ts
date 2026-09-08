/** The media queries whose changes flip the `'auto'` high-contrast state. */
const HIGH_CONTRAST_QUERIES = ['(prefers-contrast: more)', '(forced-colors: active)'];

/** Whether the OS asks for higher contrast (used by the `'auto'` high-contrast mode). */
export function prefersHighContrast(): boolean {
	if (typeof window === 'undefined' || !window.matchMedia) {
		return false;
	}
	return HIGH_CONTRAST_QUERIES.some(query => window.matchMedia(query).matches);
}

/** Resolves the `highContrast` option to a plain boolean. */
export function resolveHighContrast(option: boolean | 'auto'): boolean {
	return option === 'auto' ? prefersHighContrast() : option;
}

/** Subscribes to the OS contrast queries that drive `highContrast: 'auto'`. */
export class HighContrastWatcher {
	private _media: MediaQueryList[] = [];
	private readonly _onChange: () => void;

	public constructor(onChange: () => void) {
		this._onChange = (): void => onChange();
		if (typeof window === 'undefined' || !window.matchMedia) {
			return;
		}
		this._media = HIGH_CONTRAST_QUERIES.map(query => window.matchMedia(query));
		for (const media of this._media) {
			media.addEventListener('change', this._onChange);
		}
	}

	public dispose(): void {
		for (const media of this._media) {
			media.removeEventListener('change', this._onChange);
		}
		this._media = [];
	}
}
