import { ChartModel } from '../../model/chart-model';
import { Coordinate } from '../../model/coordinate';
import { Series } from '../../model/series';
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
		xLow: 0 as Coordinate,
		xHigh: 0 as Coordinate,
		yLow: 0 as Coordinate,
		yHigh: 0 as Coordinate,
		visible: false,

		width: 0,
		height: 0,
	};

	protected readonly _series: Series;
	protected readonly _model: ChartModel;
	protected readonly _boxRenderer: BoxRenderer = new BoxRenderer();
	private _invalidated: boolean = true;

	protected constructor(series: Series) {
		this._series = series;
		this._model = series.model();
		this._boxRenderer.setData(this._boxRendererData);
	}

	public update(): void {
		this._invalidated = true;
	}

	public renderer(height: number, width: number): IPaneRenderer | null {
		if (!this._series.visible()) {
			return null;
		}

		if (this._invalidated) {
			this._updateImpl(height, width);
			this._invalidated = false;
		}
		return this._boxRenderer;
	}

	protected abstract _updateImpl(height: number, width: number): void;
}
