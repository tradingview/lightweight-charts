let sharedContext: CanvasRenderingContext2D | null | undefined;

/**
 * A 2D context to measure text with before anything is painted — to lay out
 * labels, or to keep them from overlapping — created on first use and shared.
 * `null` where there is no DOM to create a canvas in (server-side rendering,
 * Node). Importing this module touches no DOM API.
 *
 * Set its `font` before measuring: the context is shared, so another caller
 * may have left a different one.
 */
export function textMeasureContext(): CanvasRenderingContext2D | null {
	if (sharedContext === undefined) {
		sharedContext = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
	}
	return sharedContext;
}

/** Text widths, measured once and then remembered: see {@link createTextWidthCache}. */
export interface TextWidthCache {
	/**
	 * Width of `text` drawn in `font` (a canvas `font` string), in the pixels
	 * of that font size: CSS pixels for a font given in `px`. `null` where
	 * there is nothing to measure with (see {@link textMeasureContext}); the
	 * caller then estimates, for example from the number of characters.
	 */
	measure(font: string, text: string): number | null;
	/** Forgets every width, for example once a font is no longer in use. */
	clear(): void;
}

/**
 * Creates a cache of the widths of texts measured with
 * {@link textMeasureContext}, so that measuring the same label again — on
 * every layout pass, at every zoom step — costs a map lookup. Bounded: once
 * `maxEntries` widths are kept, over every font, it starts again from empty.
 */
export function createTextWidthCache(maxEntries: number = 10000): TextWidthCache {
	const fonts = new Map<string, Map<string, number>>();
	let size = 0;
	const clear = (): void => {
		fonts.clear();
		size = 0;
	};
	return {
		measure(font: string, text: string): number | null {
			let widths = fonts.get(font);
			const known = widths?.get(text);
			if (known !== undefined) {
				return known;
			}
			const context = textMeasureContext();
			if (context === null) {
				return null;
			}
			if (size >= maxEntries) {
				clear();
				widths = undefined;
			}
			if (widths === undefined) {
				widths = new Map();
				fonts.set(font, widths);
			}
			context.font = font;
			const width = context.measureText(text).width;
			widths.set(text, width);
			size++;
			return width;
		},
		clear,
	};
}
