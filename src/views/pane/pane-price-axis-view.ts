import { ChartModel } from '../../model/chart-model';
import { IPriceDataSource } from '../../model/iprice-data-source';
import { TextWidthCache } from '../../model/text-width-cache';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { IPriceAxisViewRenderer, PriceAxisViewRendererOptions } from '../../renderers/iprice-axis-view-renderer';

import { IPriceAxisView } from '../price-axis/iprice-axis-view';
import { IPaneView } from './ipane-view';

class PanePriceAxisViewRenderer implements IPaneRenderer {
	private _priceAxisViewRenderer: IPriceAxisViewRenderer | null = null;
	private _rendererOptions: PriceAxisViewRendererOptions | null = null;
	private _align: 'left' | 'right' = 'right';
	private _width: number = 0;
	private readonly _textWidthCache: TextWidthCache;

	public constructor(textWidthCache: TextWidthCache) {
		this._textWidthCache = textWidthCache;
	}

	public setParams(
		priceAxisViewRenderer: IPriceAxisViewRenderer,
		rendererOptions: PriceAxisViewRendererOptions,
		width: number,
		align: 'left' | 'right'
	): void {
		this._priceAxisViewRenderer = priceAxisViewRenderer;
		this._rendererOptions = rendererOptions;
		this._width = width;
		this._align = align;
	}

	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number): void {
		if (this._rendererOptions === null || this._priceAxisViewRenderer === null) {
			return;
		}

		this._priceAxisViewRenderer.draw(ctx, this._rendererOptions, this._textWidthCache, this._width, this._align, pixelRatio);
	}
}

export class PanePriceAxisView implements IPaneView {
	private _priceAxisView: IPriceAxisView;
	private readonly _textWidthCache: TextWidthCache;
	private readonly _dataSource: IPriceDataSource;
	private readonly _chartModel: ChartModel;
	private readonly _renderer: PanePriceAxisViewRenderer;
	private _fontSize: number;

	public constructor(priceAxisView: IPriceAxisView, dataSource: IPriceDataSource, chartModel: ChartModel) {
		this._priceAxisView = priceAxisView;
		this._textWidthCache = new TextWidthCache(50); // when should we clear cache?
		this._dataSource = dataSource;
		this._chartModel = chartModel;
		this._fontSize = -1;
		this._renderer = new PanePriceAxisViewRenderer(this._textWidthCache);
	}

	public update(): void {
		this._priceAxisView.update();
	}

	public renderer(height: number, width: number): IPaneRenderer | null {
		const pane = this._chartModel.paneForSource(this._dataSource);
		if (pane === null) {
			return null;
		}

		const priceScale = this._dataSource.priceScale();
		if (priceScale === null) {
			return null;
		}

		const position = pane.priceScalePosition(priceScale);
		if (position === 'overlay') {
			// both source and main source are overlays
			return null;
		}

		const options = this._chartModel.priceAxisRendererOptions();
		if (options.fontSize !== this._fontSize) {
			this._fontSize = options.fontSize;
			this._textWidthCache.reset();
		}

		this._renderer.setParams(this._priceAxisView.paneRenderer(), options, width, position);
		return this._renderer;
	}
}
