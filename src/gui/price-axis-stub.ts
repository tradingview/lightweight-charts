import { getContext2d } from '../helpers/canvas-wrapper';
import { IDestroyable } from '../helpers/idestroyable';

import { ChartOptions } from '../model/chart-model';
import { InvalidationLevel } from '../model/invalidate-mask';
import { PriceAxisRendererOptionsProvider } from '../renderers/price-axis-renderer-options-provider';

import { addCanvasTo, clearRect, resizeCanvas, Size } from './canvas-utils';
import { PriceAxisWidgetSide } from './price-axis-widget';

export interface PriceAxisStubParams {
	rendererOptionsProvider: PriceAxisRendererOptionsProvider;
}

export type BorderVisibleGetter = () => boolean;

export class PriceAxisStub implements IDestroyable {
	private readonly _cell: HTMLDivElement;

	private readonly _canvas: HTMLCanvasElement;
	private readonly _ctx: CanvasRenderingContext2D;

	private readonly _rendererOptionsProvider: PriceAxisRendererOptionsProvider;

	private _options: ChartOptions;

	private _invalidated: boolean = true;

	private readonly _isLeft: boolean;
	private _size: Size = new Size(0, 0);
	private readonly _borderVisible: BorderVisibleGetter;

	public constructor(
		side: PriceAxisWidgetSide,
		options: ChartOptions,
		params: PriceAxisStubParams,
		borderVisible: BorderVisibleGetter
	) {
		this._isLeft = side === 'left';
		this._rendererOptionsProvider = params.rendererOptionsProvider;

		this._options = options;
		this._borderVisible = borderVisible;

		this._cell = document.createElement('div');
		this._cell.style.width = '25px';
		this._cell.style.height = '100%';
		this._cell.style.overflow = 'hidden';

		this._canvas = addCanvasTo(this._cell, new Size(16, 16));

		this._ctx = getContext2d(this._canvas) as CanvasRenderingContext2D;
	}

	public destroy(): void {
	}

	public update(): void {
		this._invalidated = true;
	}

	public getElement(): HTMLElement {
		return this._cell;
	}

	public setSize(size: Size): void {
		if (size.w < 0 || size.h < 0) {
			throw new Error('Try to set invalid size to PriceAxisStub ' + JSON.stringify(size));
		}

		if (!this._size.equals(size)) {
			this._size = size;

			resizeCanvas(this._canvas, size);

			this._cell.style.width = `${size.w}px`;
			this._cell.style.minWidth = `${size.w}px`; // for right calculate position of .pane-legend
			this._cell.style.height = `${size.h}px`;

			this._invalidated = true;
		}
	}

	public paint(type: InvalidationLevel): void {
		if (type < InvalidationLevel.Full && !this._invalidated) {
			return;
		}

		if (this._size.w === 0 || this._size.h === 0) {
			return;
		}

		this._invalidated = false;

		this.drawOnCanvas(this._ctx);
	}

	public drawOnCanvas(ctx: CanvasRenderingContext2D): void {
		this._drawBackground(ctx);
		this._drawBorder(ctx);
	}

	public getWidth(): number {
		return this._size.w;
	}

	public isLeft(): boolean {
		return this._isLeft;
	}

	private _drawBorder(ctx: CanvasRenderingContext2D): void {
		if (!this._borderVisible()) {
			return;
		}
		const width = this._size.w;

		ctx.save();

		ctx.fillStyle = this._options.timeScale.borderColor;

		const borderSize = this._rendererOptionsProvider.options().borderSize;

		let left;
		if (this._isLeft) {
			ctx.translate(-0.5, -0.5);
			left = width - borderSize - 1;
		} else {
			ctx.translate(-0.5, -0.5);
			left = 0;
		}

		// multiply to 2 because of we draw price scale border on the second pixel
		ctx.fillRect(left, 0, borderSize * 2, 1);
		ctx.restore();
	}

	private _drawBackground(ctx: CanvasRenderingContext2D): void {
		clearRect(ctx, 0, 0, this._size.w, this._size.h, this._options.layout.backgroundColor);
	}
}
