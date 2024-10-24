import { LineStyle, LineType } from '../../renderers/draw-line';
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../series';
import { AreaStyleOptions, LastPriceAnimationMode } from '../series-options';
import { SeriesAreaPaneView } from './area-pane-view';
import { BuiltInSeriesDefinition } from './series-def';

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

export const areaSeries: BuiltInSeriesDefinition<'Area'> = {
	type: 'Area' as const,
	isBuiltIn: true as const,
	defaultOptions: areaStyleDefaults,
	createPaneView: (series: ISeries<'Area'>, model: IChartModelBase): IUpdatablePaneView => new SeriesAreaPaneView(series, model),
};
