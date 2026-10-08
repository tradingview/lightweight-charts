/*
 The time axis' label typography and spacing, as the library computes them, for
 plugins that place or measure their own labels in step with the axis. Each
 helper names the library source it mirrors: when that changes, update it here.
 */

/** The chart options {@link timeAxisLabelFont} reads. */
export interface TimeAxisLabelFontOptions {
	/** `layout.fontSize` and `layout.fontFamily` of the chart options. */
	readonly layout: { readonly fontSize: number; readonly fontFamily: string };
	/** `timeScale.allowBoldLabels` of the chart options. */
	readonly timeScale: { readonly allowBoldLabels: boolean };
}

/**
 * The `tickMarkMaxCharacterLength` the time scale uses when the option is
 * unset or `0` (`defaultTickMarkMaxCharacterLength` in the library's
 * `src/model/time-scale.ts`).
 */
export const DEFAULT_TICK_MARK_MAX_CHARACTER_LENGTH = 8;

/**
 * The canvas `font` the time axis draws its labels in, from the chart
 * options (as `chart.options()` returns them). The axis draws the labels of
 * the highest weight in view — the major ones — in bold when
 * `timeScale.allowBoldLabels` is on, and the others in the regular font
 * (`TimeAxisWidget` in the library's `src/gui/time-axis-widget.ts`, with
 * `makeFont` from `src/helpers/make-font.ts`).
 *
 * @param options - the chart options.
 * @param major - the font of the major labels; also the one to measure with
 * for room any label can fit in, bold being the wider.
 */
export function timeAxisLabelFont(options: TimeAxisLabelFontOptions, major: boolean = false): string {
	const { fontSize, fontFamily } = options.layout;
	return `${major && options.timeScale.allowBoldLabels ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
}

/**
 * The pixels the time scale counts per character of
 * `timeScale.tickMarkMaxCharacterLength`: `(fontSize + 4) × 5 / 8`, which
 * `TimeScale.marks()` in the library's `src/model/time-scale.ts` multiplies
 * by the option to get the room it keeps between tick mark labels.
 *
 * @param fontSize - `layout.fontSize` of the chart options.
 */
export function tickMarkPixelsPerCharacter(fontSize: number): number {
	return ((fontSize + 4) * 5) / DEFAULT_TICK_MARK_MAX_CHARACTER_LENGTH;
}

/**
 * The room the time scale keeps between tick mark labels, in CSS pixels, for
 * a `timeScale.tickMarkMaxCharacterLength` of `characters`: `undefined` and
 * `0` count as the default of 8, as the library does.
 *
 * @param characters - the `tickMarkMaxCharacterLength` option.
 * @param fontSize - `layout.fontSize` of the chart options.
 */
export function tickMarkMaxLabelWidth(characters: number | undefined, fontSize: number): number {
	return tickMarkPixelsPerCharacter(fontSize) * (characters || DEFAULT_TICK_MARK_MAX_CHARACTER_LENGTH);
}

/**
 * The `timeScale.tickMarkMaxCharacterLength` which makes the time scale keep
 * `width` CSS pixels between tick mark labels: the inverse of
 * {@link tickMarkMaxLabelWidth} for any `width` above `0`. Fractional: the
 * option takes any number.
 *
 * A `width` of `0` gives `0`, which the time scale reads as its default of
 * {@link DEFAULT_TICK_MARK_MAX_CHARACTER_LENGTH} characters, not as no room:
 * pass a positive width for the closest labels, or `0` to hand the spacing
 * back to the chart.
 *
 * @param width - room between labels, CSS pixels.
 * @param fontSize - `layout.fontSize` of the chart options.
 */
export function tickMarkCharactersForWidth(width: number, fontSize: number): number {
	return width / tickMarkPixelsPerCharacter(fontSize);
}
