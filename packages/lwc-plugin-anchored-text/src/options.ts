import { PrimitivePaneViewZOrder } from 'lightweight-charts';

/** Horizontal anchor of the text within the pane. */
export type AnchoredTextHorzAlign = 'left' | 'center' | 'right';

/** Vertical anchor of the text within the pane. */
export type AnchoredTextVertAlign = 'top' | 'center' | 'bottom';

/**
 * The alignment value used by the `plugin-examples` version of this plugin.
 * Read as `'center'`.
 *
 * @deprecated Use `'center'`.
 */
export type LegacyMiddleAlign = 'middle';

export interface AnchoredTextOptions {
	/** The line of text. An empty string draws nothing. */
	text: string;
	/** Which side of the pane the text is anchored to, or centered. */
	horzAlign: AnchoredTextHorzAlign;
	/** Which edge of the pane the text is anchored to, or centered. */
	vertAlign: AnchoredTextVertAlign;
	/**
	 * Distance from the left or right pane edge, in CSS pixels. Not used when
	 * `horzAlign` is `'center'`.
	 */
	horzMargin: number;
	/**
	 * Distance from the top or bottom pane edge, in CSS pixels. Not used when
	 * `vertAlign` is `'center'`.
	 */
	vertMargin: number;
	/** Font, as a CSS `font` shorthand. */
	font: string;
	/**
	 * Height of the text, in CSS pixels. The baseline sits at the bottom of
	 * this height. When not set, the height is measured from the font.
	 */
	lineHeight?: number;
	/** Text color. */
	color: string;
	/** Whether the text is drawn at all. */
	visible: boolean;
	/** Layer the text is drawn in. */
	zOrder: PrimitivePaneViewZOrder;
}

/**
 * The options as they are passed in: every one is optional, and the two
 * alignments also accept the deprecated `'middle'`.
 */
export type AnchoredTextInputOptions = Partial<
	Omit<AnchoredTextOptions, 'horzAlign' | 'vertAlign'>
> & {
	horzAlign?: AnchoredTextHorzAlign | LegacyMiddleAlign;
	vertAlign?: AnchoredTextVertAlign | LegacyMiddleAlign;
};

/** Values used for any option which is not set. */
export const defaultOptions: AnchoredTextOptions = {
	text: '',
	horzAlign: 'left',
	vertAlign: 'top',
	horzMargin: 20,
	vertMargin: 10,
	font: 'bold 14px -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
	lineHeight: undefined,
	color: '#131722',
	visible: true,
	zOrder: 'normal',
};

function normalizeAlign<T extends string>(value: T | LegacyMiddleAlign): T | 'center' {
	return value === 'middle' ? 'center' : value;
}

/**
 * Merges a partial set of options into a complete one. An option set to
 * `undefined` is left unchanged, so `applyOptions` never resets an option by
 * accident. `lineHeight` is the exception: `undefined` is a value of its own,
 * meaning "measure the height from the font", so passing it explicitly resets
 * the option.
 */
export function mergeOptions(
	base: AnchoredTextOptions,
	options: AnchoredTextInputOptions = {}
): AnchoredTextOptions {
	return {
		text: options.text ?? base.text,
		horzAlign: options.horzAlign === undefined ? base.horzAlign : normalizeAlign(options.horzAlign),
		vertAlign: options.vertAlign === undefined ? base.vertAlign : normalizeAlign(options.vertAlign),
		horzMargin: options.horzMargin ?? base.horzMargin,
		vertMargin: options.vertMargin ?? base.vertMargin,
		font: options.font ?? base.font,
		lineHeight: 'lineHeight' in options ? options.lineHeight : base.lineHeight,
		color: options.color ?? base.color,
		visible: options.visible ?? base.visible,
		zOrder: options.zOrder ?? base.zOrder,
	};
}

/** Fills in the defaults for every option which is not set. */
export function resolveOptions(options?: AnchoredTextInputOptions): AnchoredTextOptions {
	return mergeOptions(defaultOptions, options);
}
