/**
 * Represents a type of color.
 */
export const enum ColorType {
	/** Solid color */
	Solid = 'solid',
	/** Vertical gradient color */
	VerticalGradient = 'gradient',
}

/**
 * Represents a solid color.
 */
export interface SolidColor {
	/**
	 * Type of color.
	 */
	type: ColorType.Solid;

	/**
	 * Color.
	 */
	color: string;
}

/**
 * Represents a vertical gradient of two colors.
 */
export interface VerticalGradientColor {
	/**
	 * Type of color.
	 */
	type: ColorType.VerticalGradient;

	/**
	 * Top color
	 */
	topColor: string;

	/**
	 * Bottom color
	 */
	bottomColor: string;
}

/**
 * Represents the background color of the chart.
 */
export type Background = SolidColor | VerticalGradientColor;

/** Represents layout options */
export interface LayoutOptions {
	/**
	 * Chart and scales background color.
	 *
	 * @defaultValue `{ type: ColorType.Solid, color: '#FFFFFF' }`
	 */
	background: Background;

	/**
	 * Color of text on the scales.
	 *
	 * @defaultValue `'#191919'`
	 */
	textColor: string;

	/**
	 * Font size of text on scales in pixels.
	 *
	 * @defaultValue `12`
	 */
	fontSize: number;

	/**
	 * Font family of text on the scales.
	 *
	 * @defaultValue `-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif`
	 */
	fontFamily: string;

	/**
	 * Display the TradingView attribution logo on the main chart pane.
	 *
	 * The licence for library specifies that you add the "attribution notice"
	 * from the NOTICE file to your code and a link to https://www.tradingview.com/ to
	 * the page of your website or mobile application that is available to your users.
	 * Using this attribution logo is sufficient for meeting this linking requirement.
	 * However, if you already fulfill this requirement then you can disable this
	 * attribution logo.
	 *
	 * @defaultValue true
	 */
	attributionLogo: boolean;
}
