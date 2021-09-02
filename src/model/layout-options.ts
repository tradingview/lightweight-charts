export const enum ColorType {
	Solid = 'solid',
	Gradient = 'gradient',
}
/** Solid color */
export interface SolidColor {
	type: ColorType.Solid;
	/** Background color of the chart area and the scales */
	color: string;
}

/** Gradient color */
export interface GradientColor {
	type: ColorType.Gradient;
	/** Background top color of the chart area and the scales */
	topColor: string;
	/** Background bottom color of the chart area and the scales */
	bottomColor: string;
}

export type Background = SolidColor | GradientColor;

/** Structure describing layout options */
export interface LayoutOptions {
	/** Background */
	background: Background;
	/**
	 * @deprecated Use background instead
	 * @internal
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
