import { LineStyle, LineType } from '../../renderers/draw-line';
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../series';
import { LastPriceAnimationMode, LineStyleOptions } from '../series-options';
import { SeriesLinePaneView } from './line-pane-view';
import { BuiltInSeriesDefinition } from './series-def';

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

// export class LineSeries implements BuiltInSeriesDefinition<'Line'> {
// 	// eslint-disable-next-line @typescript-eslint/tslint/config
// 	public readonly type = 'Line' as const;
// 	// eslint-disable-next-line @typescript-eslint/tslint/config
// 	public readonly isBuiltIn = true as const;
// 	public readonly defaultOptions: LineStyleOptions = lineStyleDefaults;
// 	/**
// 	* @internal
// 	*/
// 	public createPaneView(series: ISeries<'Line'>, model: IChartModelBase): IUpdatablePaneView {
// 		return new SeriesLinePaneView(series, model);
// 	}
// }
/*
 * Line series
 */
export const lineSeries: BuiltInSeriesDefinition<'Line'> = {
	type: 'Line' as const,
	isBuiltIn: true as const,
	defaultOptions: lineStyleDefaults,
	createPaneView: (series: ISeries<'Line'>, model: IChartModelBase): IUpdatablePaneView => new SeriesLinePaneView(series, model),
};

