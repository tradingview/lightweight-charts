import { ensureNotNull } from '../../helpers/assertions';

import { ChartModel } from '../../model/chart-model';
import { CrossHair, TimeAndCoordinateProvider } from '../../model/cross-hair';
import { TimeAxisViewRenderer, TimeAxisViewRendererData } from '../../renderers/time-axis-view-renderer';

import { TimeAxisView } from './time-axis-view';

export class CrossHairTimeAxisView extends TimeAxisView {
	private _invalidated: boolean = true;
	private readonly _crossHair: CrossHair;
	private readonly _model: ChartModel;
	private readonly _valueProvider: TimeAndCoordinateProvider;
	private readonly _renderer: TimeAxisViewRenderer = new TimeAxisViewRenderer();
	private readonly _rendererData: TimeAxisViewRendererData = {
		visible: false,
		background: '#4c525e',
		color: 'white',
		text: '',
		width: 0,
		coordinate: NaN,
	};

	public constructor(crossHair: CrossHair, model: ChartModel, valueProvider: TimeAndCoordinateProvider) {
		super();

		this._crossHair = crossHair;
		this._model = model;
		this._valueProvider = valueProvider;
	}

	public update(): void {
		this._invalidated = true;
	}

	public renderer(): TimeAxisViewRenderer {
		if (this._invalidated) {
			this._updateImpl();
			this._invalidated = false;
		}

		this._renderer.setData(this._rendererData);

		return this._renderer;
	}

	private _updateImpl(): void {
		const data = this._rendererData;
		data.visible = false;

		if (!this._crossHair.options().vertLine.labelVisible) {
			return;
		}

		const timeScale = this._model.timeScale();
		if (timeScale.isEmpty()) {
			return;
		}

		const currentTime = timeScale.indexToUserTime(this._crossHair.appliedIndex());
		data.width = timeScale.width();

		const value = this._valueProvider();
		if (!value.time) {
			return;
		}

		data.coordinate = value.coordinate;
		data.text = timeScale.formatDateTime(ensureNotNull(currentTime));
		data.visible = true;
	}
}
