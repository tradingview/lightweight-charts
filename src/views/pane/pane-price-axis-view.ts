import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { ChartModel } from '../../model/chart-model';
import { IPriceDataSource } from '../../model/iprice-data-source';
import { PriceLineOptions } from '../../model/price-line-options';
import { TextWidthCache } from '../../model/text-width-cache';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { IPriceAxisViewRenderer, PriceAxisViewRendererOptions } from '../../renderers/iprice-axis-view-renderer';

import { IPriceAxisView } from '../price-axis/iprice-axis-view';
import { IPaneView } from './ipane-view';

class PanePriceAxisViewRenderer implements IPaneRenderer {
	private _priceAxisViewRenderer: IPriceAxisViewRenderer | null = null;
	private _rendererOptions: PriceAxisViewRendererOptions | null = null;
	private _align: 'left' | 'right' = 'right';
	private readonly _textWidthCache: TextWidthCache;
	private readonly _closeButton: boolean;
	private readonly _draggable: boolean;
	private readonly _iconColor?: string;

	public constructor(textWidthCache: TextWidthCache, draggable?: boolean, closeButton?: boolean, iconColor?: string) {
		this._textWidthCache = textWidthCache;
		this._closeButton = Boolean(closeButton);
		this._draggable = Boolean(draggable);
		this._iconColor = iconColor;
	}

	public setParams(
		priceAxisViewRenderer: IPriceAxisViewRenderer,
		rendererOptions: PriceAxisViewRendererOptions,
		align: 'left' | 'right'
	): void {
		this._priceAxisViewRenderer = priceAxisViewRenderer;
		this._rendererOptions = rendererOptions;
		this._align = align;
	}

	public draw(target: CanvasRenderingTarget2D): void {
		if (this._rendererOptions === null || this._priceAxisViewRenderer === null) {
			return;
		}
		this._priceAxisViewRenderer.draw(target, this._rendererOptions, this._textWidthCache, this._align, this._draggable, this._closeButton, this._iconColor);
	}
}

export class PanePriceAxisView implements IPaneView {
	private _priceAxisView: IPriceAxisView;
	private readonly _textWidthCache: TextWidthCache;
	private readonly _dataSource: IPriceDataSource;
	private readonly _chartModel: ChartModel;
	private readonly _renderer: PanePriceAxisViewRenderer;
	private readonly _order: any;
	private readonly _alert: any;
	private readonly _draggable: boolean;
	private readonly _closeButton: boolean;
	private readonly _labelPosition?: 'left' | 'right';
	private readonly _iconColor?: string;
	private _fontSize: number;

	public constructor(priceAxisView: IPriceAxisView, dataSource: IPriceDataSource, chartModel: ChartModel, options?: PriceLineOptions) {
		this._priceAxisView = priceAxisView;
		this._textWidthCache = new TextWidthCache(50); // when should we clear cache?
		this._dataSource = dataSource;
		this._chartModel = chartModel;
		this._order = options?.order;
		this._alert = options?.alert;
		this._draggable = Boolean(options?.draggable);
		this._closeButton = Boolean(this._order || this._alert) && !options?.hideCloseButton;
		this._iconColor = options?.iconColor;
		this._labelPosition = options?.labelPosition;
		this._fontSize = -1;
		this._renderer = new PanePriceAxisViewRenderer(this._textWidthCache, this._draggable, this._closeButton, this._iconColor);
	}

	public renderer(): IPaneRenderer | null {
		const pane = this._chartModel.paneForSource(this._dataSource);
		if (pane === null) {
			return null;
		}

		// this price scale will be used to find label placement only (left, right, none)
		const priceScale = pane.isOverlay(this._dataSource) ? pane.defaultVisiblePriceScale() : this._dataSource.priceScale();

		if (priceScale === null) {
			return null;
		}

		const position = pane.priceScalePosition(priceScale);
		if (position === 'overlay') {
			return null;
		}

		const options = this._chartModel.priceAxisRendererOptions();
		if (options.fontSize !== this._fontSize) {
			this._fontSize = options.fontSize;
			this._textWidthCache.reset();
		}

		this._renderer.setParams(this._priceAxisView.paneRenderer(), options, this._labelPosition || position);
		return this._renderer;
	}
}
