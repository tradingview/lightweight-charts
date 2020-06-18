import { TimePoint, TimePointIndex } from './time-data';

export type PlotRowValue = [
	number,            // open
	number,            // high
	number,            // low
	number,            // close
];

export interface PlotRow {
	readonly index: TimePointIndex;
	readonly time: TimePoint;
	readonly value: PlotRowValue;
}
