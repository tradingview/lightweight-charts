/**
 * This enum is used to specify a type of color.
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
	 */
	background: Background;
	/**
	 * @deprecated Use background instead.
	 */
	backgroundColor: string;
	/**
	 * Color of text on the scales.
	 */
	textColor: string;
	/**
	 * Font size of text on scales in pixels.
	 */
	fontSize: number;
	/**
	 * Font family of text on the scales.
	 */
	fontFamily: string;
}

export type LayoutOptionsInternal = Omit<LayoutOptions, 'backgroundColor'>;
