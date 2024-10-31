import { LineStyle, LineType } from '../../renderers/draw-line';
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { Series } from '../series';
import { AreaStyleOptions, LastPriceAnimationMode } from '../series-options';
import { SeriesAreaPaneView } from './area-pane-view';
import { SeriesDefinition, SeriesDefinitionInternal } from './series-def';

export const areaStyleDefaults: AreaStyleOptions = {
	topColor: 'rgba( 46, 220, 135, 0.4)',
	bottomColor: 'rgba( 40, 221, 100, 0)',
	invertFilledArea: false,
	lineColor: '#33D778',
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
const seriesType = 'Area';
const createPaneView = (series: Series<typeof seriesType>, model: IChartModelBase): IUpdatablePaneView => new SeriesAreaPaneView(series, model);

export const createSeries = (): SeriesDefinition<typeof seriesType> => {
	const definition: SeriesDefinitionInternal<typeof seriesType> = {
		type: seriesType,
		isBuiltIn: true as const,
		defaultOptions: areaStyleDefaults,
		/**
		 * @internal
		 */
		createPaneView: createPaneView,
	};
	return definition as SeriesDefinition<typeof seriesType>;
};
export const areaSeries: SeriesDefinition<typeof seriesType> = createSeries();
