/**
 * Represents the position of a series marker relative to a bar.
 */
export type SeriesMarkerPosition = 'aboveBar' | 'belowBar' | 'inBar';

/**
 * Represents the shape of a series marker.
 */
export type SeriesMarkerShape = 'circle' | 'square' | 'arrowUp' | 'arrowDown';

/**
 * Represents a series marker.
 */
export interface SeriesMarker<TimeType> {
	/**
	 * The time of the marker.
	 */
	time: TimeType;
	/**
	 * The position of the marker.
	 */
	position: SeriesMarkerPosition;
	/**
	 * The shape of the marker.
	 */
	shape: SeriesMarkerShape;
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

export interface InternalSeriesMarker<TimeType> extends SeriesMarker<TimeType> {
	internalId: number;
}

export function convertSeriesMarker<InTimeType, OutTimeType>(sm: SeriesMarker<InTimeType>, newTime: OutTimeType, originalTime?: unknown): SeriesMarker<OutTimeType> {
	const { time: inTime, originalTime: inOriginalTime, ...values } = sm;
	/* eslint-disable @typescript-eslint/consistent-type-assertions */
	const res = {
		time: newTime,
		...values,
	} as SeriesMarker<OutTimeType>;
	/* eslint-enable @typescript-eslint/consistent-type-assertions */
	if (originalTime !== undefined) {
		res.originalTime = originalTime;
	}
	return res;
}
