/**
 * Represents the position of a series marker relative to a specific price.
 *
 * The price value should be specified in the {@link SeriesMarker.price}
 */
export type SeriesMarkerPricePosition = 'atPriceTop' | 'atPriceBottom' | 'atPriceMiddle';
/**
 * Represents the position of a series marker relative to a bar.
 */
export type SeriesMarkerBarPosition = 'aboveBar' | 'belowBar' | 'inBar';

/**
 * Represents the position of a series marker relative to a bar.
 */
export type SeriesMarkerPosition = SeriesMarkerBarPosition | SeriesMarkerPricePosition;

/**
 * Represents the shape of a series marker.
 */
export type SeriesMarkerShape = 'circle' | 'square' | 'arrowUp' | 'arrowDown';

/**
 * Represents a series marker.
 */
interface SeriesMarkerBase<TimeType> {
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
	 * The price value for exact Y-axis positioning.
	 *
	 * Required when using {@link SeriesMarkerPricePosition} position type.
	 */
	price?: number;
}

export interface SeriesMarkerBar<TimeType> extends SeriesMarkerBase<TimeType> {
	/**
	 * The position of the marker.
	 */
	position: SeriesMarkerBarPosition;
}

export interface SeriesMarkerPrice<TimeType> extends SeriesMarkerBase<TimeType> {
	/**
	 * The position of the marker.
	 */
	position: SeriesMarkerPricePosition;
	/**
	 * The price value for exact Y-axis positioning.
	 *
	 * Required when using {@link SeriesMarkerPricePosition} position type.
	 */
	price: number;
}

/**
 * Represents a series marker.
 */
export type SeriesMarker<TimeType> = SeriesMarkerBar<TimeType> | SeriesMarkerPrice<TimeType>;

export type MarkerPositions = Record<SeriesMarkerPosition, boolean>;

export interface InternalSeriesMarker<TimeType> extends SeriesMarkerBase<TimeType> {
	internalId: number;
	originalTime: unknown;
	price?: number;
}
