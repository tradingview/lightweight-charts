import { LineStyle, LineType } from '../../renderers/draw-line';
import { SeriesBaselinePaneView } from '../../views/pane/baseline-pane-view';
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../series';
import { BaselineStyleOptions, LastPriceAnimationMode } from '../series-options';
import { BuiltInSeriesDefinition } from './series-def';

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

export class BaselineSeries implements BuiltInSeriesDefinition<'Baseline'> {
	// eslint-disable-next-line @typescript-eslint/tslint/config
	public readonly type = 'Baseline' as const;
	// eslint-disable-next-line @typescript-eslint/tslint/config
	public readonly isBuiltIn = true as const;
	public readonly defaultOptions: BaselineStyleOptions = baselineStyleDefaults;
	/**
	* @internal
	*/
	public createPaneView(series: ISeries<'Baseline'>, model: IChartModelBase): IUpdatablePaneView {
		return new SeriesBaselinePaneView(series, model);
	}
}

export const baselineSeries = new BaselineSeries();
