import { CanvasElementBitmapSizeBinding, equalSizes, Size, size } from 'fancy-canvas';

import { clearRect } from '../helpers/canvas-helpers';
import { IDestroyable } from '../helpers/idestroyable';

import { ChartOptionsInternal } from '../model/chart-model';
import { InvalidationLevel } from '../model/invalidate-mask';
import { CanvasRenderingParams, getCanvasRenderingParams } from '../renderers/canvas-rendering-target';
import { PriceAxisRendererOptionsProvider } from '../renderers/price-axis-renderer-options-provider';

import { createBoundCanvas, getContext2D } from './canvas-utils';
import { PriceAxisWidgetSide } from './price-axis-widget';

export interface PriceAxisStubParams {
	rendererOptionsProvider: PriceAxisRendererOptionsProvider;
}

export type BorderVisibleGetter = () => boolean;
export type ColorGetter = () => string;

export class PriceAxisStub implements IDestroyable {
	private readonly _cell: HTMLDivElement;
	private readonly _canvasBinding: CanvasElementBitmapSizeBinding;

	private readonly _rendererOptionsProvider: PriceAxisRendererOptionsProvider;

	private _options: ChartOptionsInternal;

	private _invalidated: boolean = true;

	private readonly _isLeft: boolean;
	private _size: Size = size({ width: 0, height: 0 });
	private readonly _borderVisible: BorderVisibleGetter;
	private readonly _bottomColor: ColorGetter;

	public constructor(
		side: PriceAxisWidgetSide,
		options: ChartOptionsInternal,
		params: PriceAxisStubParams,
		borderVisible: BorderVisibleGetter,
		bottomColor: ColorGetter
	) {
		this._isLeft = side === 'left';
		this._rendererOptionsProvider = params.rendererOptionsProvider;

		this._options = options;
		this._borderVisible = borderVisible;
		this._bottomColor = bottomColor;

		this._cell = document.createElement('div');
		this._cell.style.width = '25px';
		this._cell.style.height = '100%';
		this._cell.style.overflow = 'hidden';

		this._canvasBinding = createBoundCanvas(this._cell, size({ width: 16, height: 16 }));
		this._canvasBinding.subscribeBitmapSizeChanged(this._canvasBitmapSizeChangedHandler);
	}

	public destroy(): void {
		this._canvasBinding.unsubscribeBitmapSizeChanged(this._canvasBitmapSizeChangedHandler);
		this._canvasBinding.dispose();
	}

	public getElement(): HTMLElement {
		return this._cell;
	}

	public getSize(): Size {
		return this._size;
	}

	public setSize(newSize: Size): void {
		if (!equalSizes(this._size, newSize)) {
			this._size = newSize;

			this._canvasBinding.resizeCanvasElement(newSize);

			this._cell.style.width = `${newSize.width}px`;
			this._cell.style.minWidth = `${newSize.width}px`; // for right calculate position of .pane-legend
			this._cell.style.height = `${newSize.height}px`;

			this._invalidated = true;
		}
	}

	public paint(type: InvalidationLevel): void {
		if (type < InvalidationLevel.Full && !this._invalidated) {
			return;
		}

		if (this._size.width === 0 || this._size.height === 0) {
			return;
		}

		this._invalidated = false;

		const ctx = getContext2D(this._canvasBinding.canvasElement);
		const canvasRenderingParams = getCanvasRenderingParams(this._canvasBinding);
		if (canvasRenderingParams !== null) {
			this._drawBackground(ctx, canvasRenderingParams);
			this._drawBorder(ctx, canvasRenderingParams);
		}
	}

	public getImage(): HTMLCanvasElement {
		return this._canvasBinding.canvasElement;
	}

	private _drawBorder(ctx: CanvasRenderingContext2D, renderParams: CanvasRenderingParams): void {
		if (!this._borderVisible()) {
			return;
		}
		const width = this._size.width;

		ctx.save();

		ctx.fillStyle = this._options.timeScale.borderColor;

		// TODO: we need different size for x and y
		const borderSize = Math.floor(this._rendererOptionsProvider.options().borderSize * renderParams.horizontalPixelRatio);

		const left = (this._isLeft) ? Math.round(width * renderParams.horizontalPixelRatio) - borderSize : 0;

		ctx.fillRect(left, 0, borderSize, borderSize);
		ctx.restore();
	}

	private _drawBackground(ctx: CanvasRenderingContext2D, renderParams: CanvasRenderingParams): void {
		clearRect(ctx, 0, 0, renderParams.bitmapSize.width, renderParams.bitmapSize.height, this._bottomColor());
	}

	private readonly _canvasBitmapSizeChangedHandler = () => this.paint(InvalidationLevel.Full);
}
