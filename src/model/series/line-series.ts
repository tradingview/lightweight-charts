import { LineStyle, LineType } from '../../renderers/draw-line';
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../iseries';
import { LastPriceAnimationMode, LineStyleOptions } from '../series-options';
import { SeriesLinePaneView } from './line-pane-view';
import { SeriesDefinition, SeriesDefinitionInternal } from './series-def';

export const lineStyleDefaults: LineStyleOptions = {
	color: '#2196f3',
	lineStyle: LineStyle.Solid,
	lineWidth: 3,
	lineType: LineType.Simple,
	lineVisible: true,
	crosshairMarkerVisible: true,
	crosshairMarkerRadius: 4,
	crosshairMarkerBorderColor: '',
	crosshairMarkerBorderWidth: 2,
	crosshairMarkerBackgroundColor: '',
	lastPriceAnimation: LastPriceAnimationMode.Disabled,
	pointMarkersVisible: false,
};
const seriesType = 'Line';

const createPaneView = (series: ISeries<'Line'>, model: IChartModelBase): IUpdatablePaneView => new SeriesLinePaneView(series, model);

export const createLineSeries = (): SeriesDefinition<typeof seriesType> => {
	const definition: SeriesDefinitionInternal<typeof seriesType> = {
		type: seriesType,
		isBuiltIn: true as const,
		defaultOptions: lineStyleDefaults,
		/**
		 * @internal
		 */
		createPaneView: createPaneView,
	};
	return definition as SeriesDefinition<typeof seriesType>;
};
export const lineSeries: SeriesDefinition<typeof seriesType> = createLineSeries();

