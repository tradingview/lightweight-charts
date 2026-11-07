import { PrimitivePaneViewZOrder } from 'lightweight-charts';

export interface SessionHighlightingOptions {
	/** Whether the highlighting is drawn at all. */
	visible: boolean;
	/**
	 * Layer the highlighting is drawn in. `'bottom'` puts it behind the grid
	 * and the series, where a background belongs.
	 */
	zOrder: PrimitivePaneViewZOrder;
}

/** Values used for any option which is not set. */
export const defaultOptions: SessionHighlightingOptions = {
	visible: true,
	zOrder: 'bottom',
};

/**
 * Merges a partial set of options into a complete one. An option set to
 * `undefined` is left unchanged, so `applyOptions` never resets an option by
 * accident.
 */
export function mergeOptions(
	base: SessionHighlightingOptions,
	options: Partial<SessionHighlightingOptions> = {}
): SessionHighlightingOptions {
	return {
		visible: options.visible ?? base.visible,
		zOrder: options.zOrder ?? base.zOrder,
	};
}

/** Fills in the defaults for every option which is not set. */
export function resolveOptions(options?: Partial<SessionHighlightingOptions>): SessionHighlightingOptions {
	return mergeOptions(defaultOptions, options);
}
