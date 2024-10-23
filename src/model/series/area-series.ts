import { LineStyle, LineType } from '../../renderers/draw-line';
import { SeriesAreaPaneView } from '../../views/pane/area-pane-view';
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../series';
import { AreaStyleOptions, LastPriceAnimationMode } from '../series-options';
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

export class AreaSeries implements BuiltInSeriesDefinition<'Area'> {
	// eslint-disable-next-line @typescript-eslint/tslint/config
	public readonly type = 'Area' as const;
	// eslint-disable-next-line @typescript-eslint/tslint/config
	public readonly isBuiltIn = true as const;
	public readonly defaultOptions: AreaStyleOptions = areaStyleDefaults;
	/**
	* @internal
	*/
	public createPaneView(series: ISeries<'Area'>, model: IChartModelBase): IUpdatablePaneView {
		return new SeriesAreaPaneView(series, model);
	}
}

export const areaSeries = new AreaSeries();
