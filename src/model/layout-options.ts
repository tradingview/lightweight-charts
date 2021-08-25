export enum ColorType {
	Solid = 'solid',
	Gradient = 'gradient',
}

/** Structure describing layout options */
export interface LayoutOptions {
	/** Background type: gradient or solid */
	backgroundType: ColorType;
	/** Background color of the chart area and the scales if background type is solid */
	backgroundColor: string;
	/** Background top color of the chart area and the scales if background type is gradient */
	backgroundGradientStartColor: string;
	/** Background bottom color of the chart area and the scales if background type is gradient */
	backgroundGradientEndColor: string;
	/** Color of a text on the scales */
	textColor: string;
	/** Font size of a text on the scales in pixels  */
	fontSize: number;
	/** Font family of a text on the scales */
	fontFamily: string;
}
