import {
	CustomSeriesOptions,
	customSeriesDefaultOptions,
} from 'lightweight-charts';

export interface BoxWhiskerSeriesOptions extends CustomSeriesOptions {
	/** Color of the whiskers and their end caps. */
	whiskerColor: string;
	/** Fill of the lower half of the box, from the first quartile to the median. */
	lowerBoxColor: string;
	/** Fill of the upper half of the box, from the median to the third quartile. */
	upperBoxColor: string;
	/** Color of the median line across the box. */
	medianColor: string;
	/** Color of the outlier dots. */
	outlierColor: string;
}

export const defaultOptions: BoxWhiskerSeriesOptions = {
	...customSeriesDefaultOptions,
	whiskerColor: 'rgba(106, 27, 154, 1)',
	lowerBoxColor: 'rgba(103, 58, 183, 1)',
	upperBoxColor: 'rgba(233, 30, 99, 1)',
	medianColor: 'rgba(106, 27, 154, 1)',
	outlierColor: 'rgba(149, 152, 161, 1)',
};
