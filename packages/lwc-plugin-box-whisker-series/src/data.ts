import { CustomData, Time } from 'lightweight-charts';

/**
 * Box and whisker series data: the five numbers of a box plot, the values
 * beyond the whiskers, and colors that override the series' for this point.
 * A point is whitespace unless all five numbers are finite.
 */
export interface BoxWhiskerData<HorzScaleItem = Time> extends CustomData<HorzScaleItem> {
	/** Where the lower whisker ends. */
	min: number;
	/** The first quartile: the bottom of the box. */
	q1: number;
	/** The median, drawn as a line across the box. */
	median: number;
	/** The third quartile: the top of the box. */
	q3: number;
	/** Where the upper whisker ends. */
	max: number;
	/** Values beyond the whiskers, each drawn as a dot. `null` is read as none. */
	outliers?: readonly number[] | null;
	/** Overrides the series `whiskerColor` for this point. */
	whiskerColor?: string;
	/** Overrides the series `lowerBoxColor` for this point. */
	lowerBoxColor?: string;
	/** Overrides the series `upperBoxColor` for this point. */
	upperBoxColor?: string;
	/** Overrides the series `medianColor` for this point. */
	medianColor?: string;
	/** Overrides the series `outlierColor` for this point. */
	outlierColor?: string;
}
