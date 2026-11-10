import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

export interface BackgroundShadeSeriesOptions extends CustomSeriesOptions {
	/**
	 * Shade of a bar whose value is `lowValue`, or beyond it on the side away
	 * from `highValue`. A hex, `rgb()`, `rgba()`, `hsl()` or named color.
	 */
	lowColor: string;
	/** Shade of a bar whose value is `highValue`, or beyond it. Same forms as `lowColor`. */
	highColor: string;
	/** Value shaded with `lowColor`. Values in between get a mix of the two colors. */
	lowValue: number;
	/**
	 * Value shaded with `highColor`. When it equals `lowValue`, values below it
	 * get `lowColor` and the rest `highColor`.
	 */
	highValue: number;
	/** Opacity of the whole shading, `0`–`1`, on top of any alpha in the colors. */
	opacity: number;
}

export const defaultOptions: BackgroundShadeSeriesOptions = {
	...customSeriesDefaultOptions,
	// The series draws behind the others and takes no part in the price scale,
	// so a price line or a last value label would only mislead.
	lastValueVisible: false,
	priceLineVisible: false,
	// A price scale of its own, so that the shade, which is at the bottom of
	// the series order, never sets the number format of a shared price axis.
	// The scale has no values to fit, and the chart gives it a default range,
	// so it still draws when the shade is alone on it.
	priceScaleId: 'background-shade',
	// The series color is not drawn. It is empty so that a point's own color
	// stands out: the chart hands the renderer each point's `color`, or this
	// one for a point without.
	color: '',
	lowColor: 'rgb(50, 50, 255)',
	highColor: 'rgb(255, 50, 50)',
	lowValue: 0,
	highValue: 100,
	opacity: 0.8,
};
