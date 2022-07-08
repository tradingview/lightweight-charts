import { CanvasElementBitmapSizeBinding, Size } from 'fancy-canvas';

import { assert, ensureNotNull } from '../helpers/assertions';
import { IDestroyable } from '../helpers/idestroyable';

export interface MediaCoordsRenderingScope {
	context: CanvasRenderingContext2D;
	mediaSize: Size;
}

export class CanvasRenderingTarget implements IDestroyable {
	public readonly canvasElementClientSize: Size;
	public readonly bitmapSize: Size;
	private _context: CanvasRenderingContext2D | null;

	public constructor(canvasElement: HTMLCanvasElement, canvasElementClientSize: Size, bitmapSize: Size) {
		assert(canvasElementClientSize.width !== 0 && canvasElementClientSize.height !== 0);
		this.canvasElementClientSize = canvasElementClientSize;

		assert(bitmapSize.width !== 0 && bitmapSize.height !== 0);
		this.bitmapSize = bitmapSize;

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

	public get context(): CanvasRenderingContext2D {
		if (this._context === null) {
			throw new Error('Object is disposed');
		}
		return this._context;
	}

	public get horizontalPixelRatio(): number {
		return this.bitmapSize.width / this.canvasElementClientSize.width;
	}

	public get verticalPixelRatio(): number {
		return this.bitmapSize.height / this.canvasElementClientSize.height;
	}

	public useMediaCoordinates<T>(f: (scope: MediaCoordsRenderingScope) => T): T {
		if (this._context === null) {
			throw new Error('Object is disposed');
		}
		this._context.save();
		this._context.scale(this.horizontalPixelRatio, this.verticalPixelRatio);
		const result = f({ context: this._context, mediaSize: this.canvasElementClientSize });
		this._context.restore();
		return result;
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
