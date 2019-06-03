import { Crosshair, CrosshairPriceAndCoordinate } from '../../model/crosshair';
import { PriceScale } from '../../model/price-scale';
import { PriceAxisViewRendererCommonData, PriceAxisViewRendererData } from '../../renderers/iprice-axis-view-renderer';

import { PriceAxisView } from './price-axis-view';

export type CrosshairPriceAxisViewValueProvider = (priceScale: PriceScale) => CrosshairPriceAndCoordinate;

export class CrosshairPriceAxisView extends PriceAxisView {
	private _source: Crosshair;
	private _background: string = '#4c525e';
	private readonly _priceScale: PriceScale;
	private readonly _valueProvider: CrosshairPriceAxisViewValueProvider;

	public constructor(source: Crosshair, priceScale: PriceScale, valueProvider: CrosshairPriceAxisViewValueProvider) {
		super();
		this._source = source;
		this._priceScale = priceScale;
		this._valueProvider = valueProvider;
	}

	protected _updateRendererData(
		axisRendererData: PriceAxisViewRendererData,
		paneRendererData: PriceAxisViewRendererData,
		commonRendererData: PriceAxisViewRendererCommonData
	): void {
		axisRendererData.visible = false;
		if (!this._source.options().horzLine.labelVisible) {
			return;
		}

		const mainSource = this._priceScale.mainSource();
		const firstValue = mainSource !== null ? mainSource.firstValue() : null;
		if (!this._source.visible() || this._priceScale.isEmpty() || (firstValue === null)) {
			return;
		}

		commonRendererData.background = this._background;
		commonRendererData.color = this.generateTextColor(this._background);

		const value = this._valueProvider(this._priceScale);
		commonRendererData.coordinate = value.coordinate;
		axisRendererData.text = this._priceScale.formatPrice(value.price, firstValue);
		axisRendererData.visible = true;
	}
}
