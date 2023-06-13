import { ISeriesPrimitiveBase } from '../model/iseries-primitive';
import { SeriesOptionsMap, SeriesType } from '../model/series-options';

import { IChartApi } from './ichart-api';
import { ISeriesApi } from './iseries-api';

/**
 * Object containing references to the chart and series instances, and a requestUpdate method for triggering
 * a refresh of the chart.
 */
export interface SeriesAttachedParameter<
	TSeriesType extends SeriesType = keyof SeriesOptionsMap
> {
	/**
	 * Chart instance.
	 */
	chart: IChartApi;
	/**
	 * Series to which the Primitive is attached.
	 */
	series: ISeriesApi<TSeriesType>;
	/**
	 * Request an update (redraw the chart)
	 */
	requestUpdate: () => void;
}

/**
 * Interface for series primitives. It must be implemented to add some external graphics to series.
 */
export type ISeriesPrimitive = ISeriesPrimitiveBase<
	SeriesAttachedParameter<SeriesType>
>;
