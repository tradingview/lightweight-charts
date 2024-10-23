import { LineStyle, LineType } from '../../renderers/draw-line';
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';
import { SeriesLinePaneView } from '../../views/pane/line-pane-view';

import { IChartModelBase } from '../chart-model';
import { Series } from '../series';
import { LastPriceAnimationMode, LineStyleOptions } from '../series-options';
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
/*
 * Line series
 */
export class LineSeries implements BuiltInSeriesDefinition<'Line'> {
	// eslint-disable-next-line @typescript-eslint/tslint/config
	public readonly type = 'Line' as const;
	// eslint-disable-next-line @typescript-eslint/tslint/config
	public readonly isBuiltIn = true as const;
	public readonly defaultOptions: LineStyleOptions = lineStyleDefaults;
	/**
	* @internal
	*/
	public createPaneView(series: Series<'Line'>, model: IChartModelBase): IUpdatablePaneView {
		return new SeriesLinePaneView(series, model);
	}
}

export const lineSeries = new LineSeries();
