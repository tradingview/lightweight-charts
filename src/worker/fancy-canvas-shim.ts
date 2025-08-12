// Minimal worker-side shim for the subset of fancy-canvas types used by renderers
// Provides structural-compatible types and helpers for offscreen rendering.

export interface Size { width: number; height: number }

export interface BitmapCoordinatesRenderingScope {
	context: OffscreenCanvasRenderingContext2D;
	bitmapSize: Size;
	mediaSize: Size;
	horizontalPixelRatio: number;
	verticalPixelRatio: number;
}

export interface MediaCoordinatesRenderingScope {
	context: OffscreenCanvasRenderingContext2D;
}

// Settings shape is not used in worker, keep as unknown-compatible
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CanvasRenderingContext2DSettings = any;

export class CanvasRenderingTarget2D {
	private readonly _ctx: OffscreenCanvasRenderingContext2D;
	private readonly _size: Size;
	private readonly _offsetX: number;
	private readonly _offsetY: number;
	private readonly _pixelRatio: number;

	public constructor(
        ctx: OffscreenCanvasRenderingContext2D,
        size: Size,
        offsetX: number = 0,
        offsetY: number = 0,
        pixelRatio: number = 1
    ) {
		this._ctx = ctx;
		this._size = size;
		this._offsetX = offsetX;
		this._offsetY = offsetY;
		this._pixelRatio = pixelRatio || 1;
	}

	public useBitmapCoordinateSpace<T>(fn: (scope: BitmapCoordinatesRenderingScope) => T): T {
		const { width, height } = this._size;
		const ctx = this._ctx;
		ctx.save();
		if ((ctx as any).resetTransform) {
			(ctx as any).resetTransform();
		} else {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
		}
		if (this._offsetX !== 0 || this._offsetY !== 0) {
			ctx.translate(this._offsetX, this._offsetY);
		}
		const result = fn({
			context: ctx,
			bitmapSize: { width, height },
			mediaSize: { width: width / this._pixelRatio, height: height / this._pixelRatio },
			horizontalPixelRatio: this._pixelRatio,
			verticalPixelRatio: this._pixelRatio,
		});
		ctx.restore();
		return result;
	}

	public useMediaCoordinateSpace<T>(fn: (scope: MediaCoordinatesRenderingScope) => T): T {
		const ctx = this._ctx;
		ctx.save();
		if ((ctx as any).resetTransform) {
			(ctx as any).resetTransform();
		} else {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
		}
		if (this._offsetX !== 0 || this._offsetY !== 0) {
			ctx.translate(this._offsetX, this._offsetY);
		}
		ctx.scale(this._pixelRatio, this._pixelRatio);
		const result = fn({ context: ctx });
		ctx.restore();
		return result;
	}
}

