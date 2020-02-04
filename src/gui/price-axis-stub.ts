import { Binding as CanvasCoordinateSpaceBinding } from 'fancy-canvas/coordinate-space';

import { IDestroyable } from '../helpers/idestroyable';

import { ChartOptionsInternal } from '../model/chart-model';
import { InvalidationLevel } from '../model/invalidate-mask';
import { PriceAxisRendererOptionsProvider } from '../renderers/price-axis-renderer-options-provider';

import { clearRect, createBoundCanvas, getPretransformedContext2D, Size } from './canvas-utils';
import { PriceAxisWidgetSide } from './price-axis-widget';

export interface PriceAxisStubParams {
	rendererOptionsProvider: PriceAxisRendererOptionsProvider;
}

export type BorderVisibleGetter = () => boolean;

export class PriceAxisStub implements IDestroyable {
	private readonly _cell: HTMLDivElement;
	private readonly _canvasBinding: CanvasCoordinateSpaceBinding;

	private readonly _rendererOptionsProvider: PriceAxisRendererOptionsProvider;

	private _options: ChartOptionsInternal;

	private _invalidated: boolean = true;

	private readonly _isLeft: boolean;
	private _size: Size = new Size(0, 0);
	private readonly _borderVisible: BorderVisibleGetter;

	public constructor(
		side: PriceAxisWidgetSide,
		options: ChartOptionsInternal,
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

		this._canvasBinding = createBoundCanvas(this._cell, new Size(16, 16));
		this._canvasBinding.subscribeCanvasConfigured(this._canvasConfiguredHandler);
	}

	public destroy(): void {
		this._canvasBinding.unsubscribeCanvasConfigured(this._canvasConfiguredHandler);
		this._canvasBinding.destroy();
	}

	public update(): void {
		this._invalidated = true;
	}

	public getElement(): HTMLElement {
		return this._cell;
	}

	public getSize(): Readonly<Size> {
		return this._size;
	}

	public setSize(size: Size): void {
		if (size.w < 0 || size.h < 0) {
			throw new Error('Try to set invalid size to PriceAxisStub ' + JSON.stringify(size));
		}

		if (!this._size.equals(size)) {
			this._size = size;

			this._canvasBinding.resizeCanvas({ width: size.w, height: size.h });

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

		const ctx = getPretransformedContext2D(this._canvasBinding);
		this._drawBackground(ctx);
		this._drawBorder(ctx);
	}

	public getImage(): HTMLCanvasElement {
		return this._canvasBinding.canvas;
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

		let left: number;
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

	private readonly _canvasConfiguredHandler = () => this.paint(InvalidationLevel.Full);
}
