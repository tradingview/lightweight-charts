/**
 * The `ColorType` enum is used to specify a type of color.
 */
export const enum ColorType {
	/** Solid color */
	Solid = 'solid',
	/** Vertical gradient color */
	VerticalGradient = 'gradient',
}

export interface SolidColor {
	type: ColorType.Solid;
	/** Color */
	color: string;
}

export interface VerticalGradientColor {
	type: ColorType.VerticalGradient;
	/** Top color */
	topColor: string;
	/** Bottom color */
	bottomColor: string;
}

export type Background = SolidColor | VerticalGradientColor;

/** Structure describing layout options */
export interface LayoutOptions {
	/**
	 * Chart and scales background color.
	 *
	 * @default { type: ColorType.Solid, color: '#ffffff' }
	 */
	background: Background;
	/**
	 * @deprecated Use background instead.
	 */
	backgroundColor: string;
	/**
	 * Color of text on the scales.
	 *
	 * @default '#191919'
	 */
	textColor: string;
	/**
	 * Font size of text on scales in pixels.
	 *
	 * @default 11
	 */
	fontSize: number;
	/**
	 * Font family of text on the scales.
	 *
	 * @default "'Trebuchet MS', Roboto, Ubuntu, sans-serif"
	 */
	fontFamily: string;
}

export type LayoutOptionsInternal = Omit<LayoutOptions, 'backgroundColor'>;
