import { defaultFontFamily } from '../../helpers/make-font';

import { HorzAlign, VertAlign } from '../types';

export interface TextWatermarkOptions {
	/**
	 * Display the watermark.
	 *
	 * @defaultValue `true`
	 */
	visible: boolean;

	/**
	 * Horizontal alignment inside the chart area.
	 *
	 * @defaultValue `'center'`
	 */
	horzAlign: HorzAlign;

	/**
	 * Vertical alignment inside the chart area.
	 *
	 * @defaultValue `'center'`
	 */
	vertAlign: VertAlign;

	/**
	 * Text to be displayed within the watermark. Each item
	 * in the array is treated as new line.
	 *
	 * @defaultValue `[]`
	 */
	lines: TextWatermarkLineOptions[];
}

export interface TextWatermarkLineOptions {
	/**
	 * Watermark color.
	 *
	 * @defaultValue `'rgba(0, 0, 0, 0.5)'`
	 */

	color: string;
	/**
	 * Text of the watermark. Word wrapping is not supported.
	 *
	 * @defaultValue `''`
	 */
	text: string;

	/**
	 * Font size in pixels.
	 *
	 * @defaultValue `48`
	 */
	fontSize: number;

	/**
	 * Line height in pixels.
	 *
	 * @defaultValue `1.2 * fontSize`
	 */
	lineHeight?: number;

	/**
	 * Font family.
	 *
	 * @defaultValue `-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif`
	 */
	fontFamily: string;

	/**
	 * Font style.
	 *
	 * @defaultValue `''`
	 */
	fontStyle: string;
}

export const textWatermarkOptionsDefaults: TextWatermarkOptions = {
	visible: true,
	horzAlign: 'center',
	vertAlign: 'center',
	lines: [],
};

export const textWatermarkLineOptionsDefaults: TextWatermarkLineOptions = {
	color: 'rgba(0, 0, 0, 0.5)',
	fontSize: 48,
	fontFamily: defaultFontFamily,
	fontStyle: '',
	text: '',
};
