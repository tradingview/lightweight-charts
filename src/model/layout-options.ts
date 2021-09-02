export const enum ColorType {
	Solid = 'solid',
	VerticalGradient = 'gradient',
}
/** Solid color */
export interface SolidColor {
	type: ColorType.Solid;
	/** Color */
	color: string;
}

/** Vertical gradient color */
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
	/** Chart and scales background */
	background: Background;
	/**
	 * @deprecated Use background instead
	 */
	backgroundColor: string;
	/** Color of a text on the scales */
	textColor: string;
	/** Font size of a text on the scales in pixels  */
	fontSize: number;
	/** Font family of a text on the scales */
	fontFamily: string;
}

export type LayoutOptionsInternal = Omit<LayoutOptions, 'backgroundColor'>;
