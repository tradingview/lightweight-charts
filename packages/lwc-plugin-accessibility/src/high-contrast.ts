import { HIGH_CONTRAST_QUERIES, mediaQueryMatches, subscribeMediaQuery } from '@tradingview/lwc-toolkit/dom/media-query';

/** Whether the OS asks for higher contrast (used by the `'auto'` high-contrast mode). */
export function prefersHighContrast(): boolean {
	return mediaQueryMatches(HIGH_CONTRAST_QUERIES);
}

/** Resolves the `highContrast` option to a plain boolean. */
export function resolveHighContrast(option: boolean | 'auto'): boolean {
	return option === 'auto' ? prefersHighContrast() : option;
}

/**
 * Subscribes to the OS contrast queries that drive `highContrast: 'auto'`. The
 * toolkit shares one `MediaQueryList` per query across every pane and chart, so
 * this costs one listener per pane rather than one list per pane.
 */
export class HighContrastWatcher {
	private _unsubscribe: () => void;

	public constructor(onChange: () => void) {
		this._unsubscribe = subscribeMediaQuery(HIGH_CONTRAST_QUERIES, () => onChange());
	}

	public dispose(): void {
		this._unsubscribe();
		this._unsubscribe = (): void => {};
	}
}
