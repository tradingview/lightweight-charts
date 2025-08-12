// Minimal adapter that provides a subset of CanvasRenderingTarget2D-like API
// backed by OffscreenCanvasRenderingContext2D

export interface BitmapScope {
	context: OffscreenCanvasRenderingContext2D;
	bitmapSize: { width: number; height: number };
	mediaSize: { width: number; height: number };
	horizontalPixelRatio: number;
	verticalPixelRatio: number;
}

export interface MediaScope {
	context: OffscreenCanvasRenderingContext2D;
}

export class OffscreenCanvasTarget2D {
	private readonly _ctx: OffscreenCanvasRenderingContext2D;
	private readonly _width: number;
	private readonly _height: number;
	private readonly _offsetX: number;
	private readonly _offsetY: number;
	private readonly _pixelRatio: number;

	public constructor(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number, offsetX: number = 0, offsetY: number = 0, pixelRatio: number = 1) {
		this._ctx = ctx;
		this._width = width;
		this._height = height;
		this._offsetX = offsetX;
		this._offsetY = offsetY;
		this._pixelRatio = pixelRatio || 1;
	}

	public useBitmapCoordinateSpace<T>(fn: (scope: BitmapScope) => T): T {
		this._ctx.save();
        // Reset transform to identity for bitmap space (no scaling)
		if ((this._ctx as unknown as { resetTransform?: () => void }).resetTransform) {
			(this._ctx as unknown as { resetTransform: () => void }).resetTransform();
		} else {
			this._ctx.setTransform(1, 0, 0, 1, 0, 0);
		}
		if (this._offsetX !== 0 || this._offsetY !== 0) {
			this._ctx.translate(this._offsetX, this._offsetY);
		}
		const result = fn({
			context: this._ctx,
			bitmapSize: { width: this._width, height: this._height },
			mediaSize: { width: this._width / this._pixelRatio, height: this._height / this._pixelRatio },
			horizontalPixelRatio: this._pixelRatio,
			verticalPixelRatio: this._pixelRatio,
		});
		this._ctx.restore();
		return result;
	}

	public useMediaCoordinateSpace<T>(fn: (scope: MediaScope) => T): T {
		this._ctx.save();
        // Reset transform and scale by DPR to map media coordinates to bitmap
		const ctx = this._ctx;
		if ((ctx as unknown as { resetTransform?: () => void }).resetTransform) {
			(ctx as unknown as { resetTransform: () => void }).resetTransform();
		} else {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
		}
		if (this._offsetX !== 0 || this._offsetY !== 0) {
			ctx.translate(this._offsetX, this._offsetY);
		}
		ctx.scale(this._pixelRatio, this._pixelRatio);
		const result = fn({ context: ctx });
		this._ctx.restore();
		return result;
	}
}

