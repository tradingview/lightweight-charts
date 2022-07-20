import { CanvasElementBitmapSizeBinding, Size } from 'fancy-canvas';

import { assert, ensureNotNull } from '../helpers/assertions';
import { IDestroyable } from '../helpers/idestroyable';

export interface MediaCoordsRenderingScope {
	readonly context: CanvasRenderingContext2D;
	readonly mediaSize: Size;
}

export interface BitmapCoordsRenderingScope {
	readonly context: CanvasRenderingContext2D;
	readonly mediaSize: Size;
	readonly bitmapSize: Size;
	readonly horizontalPixelRatio: number;
	readonly verticalPixelRatio: number;
}

export class CanvasRenderingTarget implements IDestroyable {
	private readonly _canvasElementClientSize: Size;
	private readonly _bitmapSize: Size;
	private _context: CanvasRenderingContext2D | null;

	public constructor(canvasElement: HTMLCanvasElement, canvasElementClientSize: Size, bitmapSize: Size) {
		assert(canvasElementClientSize.width !== 0 && canvasElementClientSize.height !== 0);
		this._canvasElementClientSize = canvasElementClientSize;

		assert(bitmapSize.width !== 0 && bitmapSize.height !== 0);
		this._bitmapSize = bitmapSize;

		this._context = ensureNotNull(canvasElement.getContext('2d'));
		this._context.save();
		// sometimes (very often) ctx getContext returns the same context every time
		// and there might be previous transformation
		// so let's reset it to be sure that everything is ok
		// do no use resetTransform to respect Edge
		this._context.setTransform(1, 0, 0, 1, 0, 0);
	}

	public destroy(): void {
		if (this._context === null) {
			throw new Error('Object is already disposed');
		}
		this._context.restore();
		this._context = null;
	}

	public useMediaCoordinates<T>(f: (scope: MediaCoordsRenderingScope) => T): T {
		if (this._context === null) {
			throw new Error('Object is disposed');
		}
		this._context.save();
		this._context.scale(this._horizontalPixelRatio, this._verticalPixelRatio);
		const result = f({ context: this._context, mediaSize: this._canvasElementClientSize });
		this._context.restore();
		return result;
	}

	public useBitmapCoordinates<T>(f: (scope: BitmapCoordsRenderingScope) => T): T {
		if (this._context === null) {
			throw new Error('Object is disposed');
		}
		this._context.save();
		const result = f({
			context: this._context,
			mediaSize: this._canvasElementClientSize,
			bitmapSize: this._bitmapSize,
			horizontalPixelRatio: this._horizontalPixelRatio,
			verticalPixelRatio: this._verticalPixelRatio,
		});
		this._context.restore();
		return result;
	}

	private get _horizontalPixelRatio(): number {
		return this._bitmapSize.width / this._canvasElementClientSize.width;
	}

	private get _verticalPixelRatio(): number {
		return this._bitmapSize.height / this._canvasElementClientSize.height;
	}
}

export function createCanvasRenderingTarget(binding: CanvasElementBitmapSizeBinding): CanvasRenderingTarget | null {
	const canvasSize = binding.canvasElementClientSize;
	if (canvasSize.width === 0 || canvasSize.height === 0) {
		return null;
	}

	const bitmapSize = binding.bitmapSize;
	if (bitmapSize.width === 0 || bitmapSize.height === 0) {
		return null;
	}

	return new CanvasRenderingTarget(binding.canvasElement, binding.canvasElementClientSize, binding.bitmapSize);
}
