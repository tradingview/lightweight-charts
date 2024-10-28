import { LineStyle, LineType } from '../../renderers/draw-line';
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { Series, SeriesOptionsInternal } from '../series';
import { BaselineStyleOptions, LastPriceAnimationMode } from '../series-options';
import { SeriesBaselinePaneView } from './baseline-pane-view';
import { SeriesDefinition } from './series-def';

export const baselineStyleDefaults: BaselineStyleOptions = {
	baseValue: {
		type: 'price',
		price: 0,
	},

	topFillColor1: 'rgba(38, 166, 154, 0.28)',
	topFillColor2: 'rgba(38, 166, 154, 0.05)',
	topLineColor: 'rgba(38, 166, 154, 1)',

	bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
	bottomFillColor2: 'rgba(239, 83, 80, 0.28)',
	bottomLineColor: 'rgba(239, 83, 80, 1)',

	lineWidth: 3,
	lineStyle: LineStyle.Solid,
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
const seriesType = 'Baseline';
const createPaneView = (series: Series<typeof seriesType>, model: IChartModelBase): IUpdatablePaneView => new SeriesBaselinePaneView(series, model);

export const baselineSeries: SeriesDefinition<typeof seriesType> = {
	type: seriesType,
	isBuiltIn: true as const,
	defaultOptions: baselineStyleDefaults,
	createSeries: (model: IChartModelBase, options: SeriesOptionsInternal<typeof seriesType>): Series<typeof seriesType> => {
		return new Series<typeof seriesType>(model, seriesType, options, createPaneView);
	},
};

