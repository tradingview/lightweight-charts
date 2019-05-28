import { TimePointIndex } from './time-data';

export type PlotValue = number | null | undefined;
export interface PlotRow<TimeType, PlotValueTuple extends PlotValue[]> {
	readonly index: TimePointIndex;
	readonly time: TimeType;
	readonly value: PlotValueTuple;
}
