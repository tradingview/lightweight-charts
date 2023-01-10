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
		additionalPaddingBottom: 0,
		additionalPaddingTop: 0,
	};

	private readonly _axisRendererData: PriceAxisViewRendererData = {
		text: '',
		visible: false,
		tickVisible: true,
		moveTextToInvisibleTick: false,
		borderColor: '',
		color: '#FFF',
		borderVisible: false,
		separatorVisible: false,
	};

	private readonly _paneRendererData: PriceAxisViewRendererData = {
		text: '',
		visible: false,
		tickVisible: false,
		moveTextToInvisibleTick: true,
		borderColor: '',
		color: '#FFF',
		borderVisible: true,
		separatorVisible: true,
	};

	private readonly _axisRenderer: IPriceAxisViewRenderer;
	private readonly _paneRenderer: IPriceAxisViewRenderer;
	private _invalidated: boolean = true;

	public constructor(ctor?: IPriceAxisViewRendererConstructor) {
		this._axisRenderer = new (ctor || PriceAxisViewRenderer)(this._axisRendererData, this._commonRendererData);
		this._paneRenderer = new (ctor || PriceAxisViewRenderer)(this._paneRendererData, this._commonRendererData);
	}

	public text(): string {
		this._updateRendererDataIfNeeded();
		return this._axisRendererData.text;
	}

	public coordinate(): number {
		this._updateRendererDataIfNeeded();
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
		this._updateRendererDataIfNeeded();
		return this._axisRendererData.visible || this._paneRendererData.visible;
	}

	public isAxisLabelVisible(): boolean {
		this._updateRendererDataIfNeeded();
		return this._axisRendererData.visible;
	}

	public renderer(priceScale: PriceScale): IPriceAxisViewRenderer {
		this._updateRendererDataIfNeeded();

		// force update tickVisible state from price scale options
		// because we don't have and we can't have price axis in other methods
		// (like paneRenderer or any other who call _updateRendererDataIfNeeded)
		this._axisRendererData.tickVisible = this._axisRendererData.tickVisible && priceScale.options().ticksVisible;
		this._paneRendererData.tickVisible = this._paneRendererData.tickVisible && priceScale.options().ticksVisible;

		this._axisRenderer.setData(this._axisRendererData, this._commonRendererData);
		this._paneRenderer.setData(this._paneRendererData, this._commonRendererData);

		return this._axisRenderer;
	}

	public paneRenderer(): IPriceAxisViewRenderer {
		this._updateRendererDataIfNeeded();
		this._axisRenderer.setData(this._axisRendererData, this._commonRendererData);
		this._paneRenderer.setData(this._paneRendererData, this._commonRendererData);

		return this._paneRenderer;
	}

	protected abstract _updateRendererData(
		axisRendererData: PriceAxisViewRendererData,
		paneRendererData: PriceAxisViewRendererData,
		commonData: PriceAxisViewRendererCommonData
	): void;

	private _updateRendererDataIfNeeded(): void {
		if (this._invalidated) {
			this._axisRendererData.tickVisible = true;
			this._paneRendererData.tickVisible = false;
			this._updateRendererData(this._axisRendererData, this._paneRendererData, this._commonRendererData);
		}
	}
}
