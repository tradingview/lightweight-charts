import { Time } from '../model/horz-scale-behavior-time/types';
import { ISeriesPrimitiveBase } from '../model/iseries-primitive';
import { SeriesOptionsMap, SeriesType } from '../model/series-options';

import { IChartApiBase } from './ichart-api';
import { ISeriesApi } from './iseries-api';

/**
 * Object containing references to the chart and series instances, and a requestUpdate method for triggering
 * a refresh of the chart.
 */
export interface SeriesAttachedParameter<
	HorzScaleItem = Time,
	TSeriesType extends SeriesType = keyof SeriesOptionsMap
> {
	/**
	 * Chart instance.
	 */
	chart: IChartApiBase<HorzScaleItem>;
	/**
	 * Series to which the Primitive is attached.
	 */
	series: ISeriesApi<TSeriesType, HorzScaleItem>;
	/**
	 * Request an update (redraw the chart)
	 */
	requestUpdate: () => void;
}

/**
 * Interface for series primitives. It must be implemented to add some external graphics to series.
 */
export type ISeriesPrimitive<HorzScaleItem = Time> = ISeriesPrimitiveBase<
	SeriesAttachedParameter<HorzScaleItem, SeriesType>
>;
