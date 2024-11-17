import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { Time } from '../../model/horz-scale-behavior-time/types';
import { Series } from '../../model/series';
import { SeriesType } from '../../model/series-options';
import { BoxRenderer, BoxRendererData } from '../../renderers/box-renderer';
import { LineStyle } from '../../renderers/draw-line';
import { IPaneRenderer } from '../../renderers/ipane-renderer';

import { IPaneView } from './ipane-view';

export abstract class SeriesBoxPaneView implements IPaneView {
	protected readonly _boxRendererData: BoxRendererData = {
		fillColor: '#000',
		fillOpacity: 1,
		borderColor: '#000',
		borderStyle: LineStyle.Solid,
		borderWidth: 1,
		borderVisible: false,
		corners: [],
		xLow: 0 as Coordinate,
		xHigh: 0 as Coordinate,
		yLow: 0 as Coordinate,
		yHigh: 0 as Coordinate,
		visible: false,

		width: 0,
		height: 0,
	};

	protected readonly _series: Series<SeriesType>;
	protected readonly _model: ChartModel<Time>;
	protected readonly _boxRenderer: BoxRenderer = new BoxRenderer();
	private _invalidated: boolean = true;

	protected constructor(series: Series<SeriesType>) {
		this._series = series;
		this._model = series.model() as any;
		this._boxRenderer.setData(this._boxRendererData);
	}

	public update(): void {
		this._invalidated = true;
	}

	public renderer(): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		if (this._invalidated) {
			this._updateImpl();
			this._invalidated = false;
		}
		return this._boxRenderer;
	}

	protected abstract _updateImpl(): void;
}