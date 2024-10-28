import { LineStyle, LineType } from '../../renderers/draw-line';
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { Series, SeriesOptionsInternal } from '../series';
import { LastPriceAnimationMode, LineStyleOptions } from '../series-options';
import { SeriesLinePaneView } from './line-pane-view';
import { SeriesDefinition } from './series-def';

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

const createPaneView = (series: Series<'Line'>, model: IChartModelBase): IUpdatablePaneView => new SeriesLinePaneView(series, model);
/*
 * Line series
 */
export const lineSeries: SeriesDefinition<'Line'> = {
	type: 'Line' as const,
	isBuiltIn: true as const,
	defaultOptions: lineStyleDefaults,
	createSeries: (model: IChartModelBase, options: SeriesOptionsInternal<'Line'>): Series<'Line'> => {
		return new Series<'Line'>(model, 'Line', options, createPaneView);
	},
};

