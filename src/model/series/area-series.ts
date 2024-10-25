import { LineStyle, LineType } from '../../renderers/line-types';
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { Series, SeriesOptionsInternal } from '../series';
import { AreaStyleOptions, LastPriceAnimationMode } from '../series-options';
import { SeriesAreaPaneView } from './area-pane-view';
import { SeriesDefinition } from './series-def';

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
export const areaSeries: SeriesDefinition<'Area'> = {
	type: seriesType,
	isBuiltIn: true as const,
	defaultOptions: areaStyleDefaults,
	createSeries: (model: IChartModelBase, options: SeriesOptionsInternal<typeof seriesType>): Series<typeof seriesType> => {
		return new Series<typeof seriesType>(model, seriesType, options, createPaneView);
	},
};
