import { ensureNotNull } from '../../helpers/assertions';
import { generateTextColor } from '../../helpers/color';

import { DataSource } from '../../model/data-source';
import { PriceScale } from '../../model/price-scale';
import {
	IPriceAxisViewRenderer,
	IPriceAxisViewRendererConstructor,
	PriceAxisViewRendererCommonData,
	PriceAxisViewRendererData,
	PriceAxisViewRendererOptions,
} from '../../renderers/iprice-axis-view-renderer';
import { PriceAxisViewRenderer } from '../../renderers/price-axis-view-renderer';

import { IPriceAxisView } from './iprice-axis-view';

export abstract class PriceAxisView implements IPriceAxisView {
	private readonly _commonRendererData: PriceAxisViewRendererCommonData = {
		coordinate: 0,
		color: '#FFF',
		background: '#000',
	};

	private readonly _axisRendererData: PriceAxisViewRendererData = {
		text: '',
		visible: false,
		tickVisible: true,
		borderColor: '',
	};

	private readonly _paneRendererData: PriceAxisViewRendererData = {
		text: '',
		visible: false,
		tickVisible: false,
		borderColor: '',
	};

	private readonly _axisRenderer: IPriceAxisViewRenderer;
	private readonly _paneRenderer: IPriceAxisViewRenderer;
	private _invalidated: boolean = true;

	public constructor(ctor?: IPriceAxisViewRendererConstructor) {
		this._axisRenderer = new (ctor || PriceAxisViewRenderer)(this._axisRendererData, this._commonRendererData);
		this._paneRenderer = new (ctor || PriceAxisViewRenderer)(this._paneRendererData, this._commonRendererData);
	}

	public text(): string {
		return this._axisRendererData.text;
	}

	public background(): string {
		return this._commonRendererData.background;
	}

	public color(): string {
		return generateTextColor(this.background());
	}

	public coordinate(): number {
		this._updateRendererDataIfNeeded(ensureNotNull(this._getSource().priceScale()));
		return this._commonRendererData.coordinate;
	}

	public update(): void {
		this._invalidated = true;
	}

	public height(rendererOptions: PriceAxisViewRendererOptions, useSecondLine: boolean = false): number {
		return Math.max(
			this._axisRenderer.height(rendererOptions, useSecondLine),
			this._paneRenderer.height(rendererOptions, useSecondLine)
		);
	}

	public getFixedCoordinate(): number {
		return this._commonRendererData.fixedCoordinate || 0;
	}

	public setFixedCoordinate(value: number): void {
		this._commonRendererData.fixedCoordinate = value;
	}

	public isVisible(): boolean {
		this._updateRendererDataIfNeeded(ensureNotNull(this._getSource().priceScale()));
		return this._axisRendererData.visible || this._paneRendererData.visible;
	}

	public isAxisLabelVisible(): boolean {
		this._updateRendererDataIfNeeded(ensureNotNull(this._getSource().priceScale()));
		return this._axisRendererData.visible;
	}

	public isPaneLabelVisible(): boolean {
		this._updateRendererDataIfNeeded(ensureNotNull(this._getSource().priceScale()));
		return this._paneRendererData.visible;
	}

	public renderer(priceScale: PriceScale): IPriceAxisViewRenderer {
		this._updateRendererDataIfNeeded(priceScale);
		this._axisRenderer.setData(this._axisRendererData, this._commonRendererData);
		this._paneRenderer.setData(this._paneRendererData, this._commonRendererData);

		return this._axisRenderer;
	}

	public paneRenderer(): IPriceAxisViewRenderer {
		this._updateRendererDataIfNeeded(ensureNotNull(this._getSource().priceScale()));
		this._axisRenderer.setData(this._axisRendererData, this._commonRendererData);
		this._paneRenderer.setData(this._paneRendererData, this._commonRendererData);

		return this._paneRenderer;
	}

	protected abstract _getSource(): DataSource;

	protected abstract _updateRendererData(
		axisRendererData: PriceAxisViewRendererData,
		paneRendererData: PriceAxisViewRendererData,
		commonData: PriceAxisViewRendererCommonData
	): void;

	private _updateRendererDataIfNeeded(priceScale: PriceScale): void {
		if (this._invalidated) {
			this._axisRendererData.tickVisible = true;
			this._paneRendererData.tickVisible = false;
			this._updateRendererData(this._axisRendererData, this._paneRendererData, this._commonRendererData);
			this._axisRendererData.tickVisible = this._axisRendererData.tickVisible && priceScale.options().drawTicks;
			this._paneRendererData.tickVisible = this._paneRendererData.tickVisible && priceScale.options().drawTicks;
		}
	}
}
