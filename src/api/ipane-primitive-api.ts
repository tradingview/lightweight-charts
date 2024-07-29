import { Time } from '../model/horz-scale-behavior-time/types';
import { IPanePrimitiveBase } from '../model/ipane-primitive';

import { IChartApiBase } from './ichart-api';

/**
 * Object containing references to the chart instance, and a requestUpdate method for triggering
 * a refresh of the chart.
 */
export interface PaneAttachedParameter<
	HorzScaleItem = Time
> {
	/**
	 * Chart instance.
	 */
	chart: IChartApiBase<HorzScaleItem>;
	/**
	 * Request an update (redraw the chart)
	 */
	requestUpdate: () => void;
}

/**
 * Interface for pane primitives. It must be implemented to add some external graphics to a pane.
 */
export type IPanePrimitive<HorzScaleItem = Time> = IPanePrimitiveBase<
    PaneAttachedParameter<HorzScaleItem>
>;
