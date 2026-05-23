import { LineStyle, LineWidth } from '../renderers/draw-line';

/**
 * Represents a price line options.
 */
export interface PriceLineOptions {
	/**
	 * The optional ID of this price line.
	 */
	id?: string;
	/**
	 * Price line's value.
	 *
	 * @defaultValue `0`
	 */
	price: number;
	/**
	 * Price line's color.
	 *
	 * @defaultValue `''`
	 */
	color: string;
	/**
	 * Price line's width in pixels.
	 *
	 * @defaultValue `1`
	 */
	lineWidth: LineWidth;
	/**
	 * Price line's style.
	 *
	 * @defaultValue {@link LineStyle.Solid}
	 */
	lineStyle: LineStyle;
	/**
	 * Display line.
	 *
	 * @defaultValue `true`
	 */
	lineVisible: boolean;
	/**
	 * Display the current price value in on the price scale.
	 *
	 * @defaultValue `true`
	 */
	axisLabelVisible: boolean;
	/**
	 * Price line's on the chart pane.
	 *
	 * @defaultValue `''`
	 */
	title: string;
	/**
	 * Background color for the axis label.
	 * Will default to the price line color if unspecified.
	 *
	 * @defaultValue `''`
	 */
	axisLabelColor: string;
	/**
	 * Text color for the axis label.
	 *
	 * @defaultValue `''`
	 */
	axisLabelTextColor: string;
	/**
	 * Hit-test tolerance in pixels, added on each side of the line (in addition to its
	 * {@link lineWidth}) when determining whether a pointer event hits this price line.
	 * Lower values require more precise pointing; `0` limits hits to the line itself.
	 * Useful on desktop where the default tolerance can cause nearby price lines to
	 * register as the same hit.
	 *
	 * @defaultValue `7`
	 */
	hitTestTolerance: number;
}

/**
 * Price line options for the {@link ISeriesApi.createPriceLine} method.
 *
 * `price` is required, while the rest of the options are optional.
 */
export type CreatePriceLineOptions = Partial<PriceLineOptions> & Pick<PriceLineOptions, 'price'>;
