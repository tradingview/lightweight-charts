import { AnchoredTextOptions } from './options.js';

/** What the renderer measured about the text, in CSS pixels. */
export interface TextMeasure {
	width: number;
	/** Distance from the baseline to the top of the font. */
	ascent: number;
	/** Distance from the baseline to the bottom of the font. */
	descent: number;
}

export interface Size {
	width: number;
	height: number;
}

/** Where the text goes, in CSS pixels of the pane. */
export interface TextLayout {
	x: number;
	y: number;
	width: number;
	height: number;
	/** The `y` to pass to `fillText` with the default (alphabetic) baseline. */
	baselineY: number;
}

type LayoutOptions = Pick<
	AnchoredTextOptions,
	'horzAlign' | 'vertAlign' | 'horzMargin' | 'vertMargin' | 'lineHeight'
>;

/**
 * Places the text box within the pane. Nothing is clamped: text wider than
 * the pane overflows it, and the pane canvas trims it at the edge.
 */
export function layoutAnchoredText(text: TextMeasure, pane: Size, options: LayoutOptions): TextLayout {
	const width = text.width;
	const measured = options.lineHeight === undefined;
	const height = measured ? text.ascent + text.descent : options.lineHeight as number;

	let x: number;
	switch (options.horzAlign) {
		case 'left':
			x = options.horzMargin;
			break;
		case 'center':
			x = (pane.width - width) / 2;
			break;
		case 'right':
			x = pane.width - options.horzMargin - width;
			break;
	}

	let y: number;
	switch (options.vertAlign) {
		case 'top':
			y = options.vertMargin;
			break;
		case 'center':
			y = (pane.height - height) / 2;
			break;
		case 'bottom':
			y = pane.height - options.vertMargin - height;
			break;
	}

	const baselineY = y + (measured ? text.ascent : height);
	return { x, y, width, height, baselineY };
}
