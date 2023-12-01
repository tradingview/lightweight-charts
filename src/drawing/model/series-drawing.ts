/**
 * Represents the position of a series marker relative to a bar.
 */
export type SeriesDrawingPosition = 'aboveBar' | 'belowBar' | 'inBar';

/**
 * Represents the shape of a series marker.
 */
export type SeriesDrawingShape = 'circle' | 'square' | 'arrowUp' | 'arrowDown';

/**
 * Represents a series marker.
 */
export interface SeriesDrawing<TimeType> {
	/**
	 * The time of the marker.
	 */
	time: TimeType;
	/**
	 * The position of the marker.
	 */
	position: SeriesDrawingPosition;
	/**
	 * The shape of the marker.
	 */
	shape: SeriesDrawingShape;
	/**
	 * The color of the marker.
	 */
	color: string;
	/**
	 * The ID of the marker.
	 */
	id?: string;
	/**
	 * The optional text of the marker.
	 */
	text?: string;
	/**
	 * The optional size of the marker.
	 *
	 * @defaultValue `1`
	 */
	size?: number;

	/**
	 * @internal
	 */
	originalTime: unknown;
}

export interface InternalSeriesDrawing<TimeType> extends SeriesDrawing<TimeType> {
	internalId: number;
}

export function convertSeriesDrawing<InTimeType, OutTimeType>(sm: SeriesDrawing<InTimeType>, newTime: OutTimeType, originalTime?: unknown): SeriesDrawing<OutTimeType> {
	const { time: inTime, originalTime: inOriginalTime, ...values } = sm;
	/* eslint-disable @typescript-eslint/consistent-type-assertions */
	const res = {
		time: newTime,
		...values,
	} as SeriesDrawing<OutTimeType>;
	/* eslint-enable @typescript-eslint/consistent-type-assertions */
	if (originalTime !== undefined) {
		res.originalTime = originalTime;
	}
	return res;
}
