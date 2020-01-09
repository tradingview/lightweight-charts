import { IPaneRenderer } from './ipane-renderer';

export abstract class ScaledRenderer implements IPaneRenderer {
	public draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		ctx.save();
		ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		this._drawImpl(ctx, isHovered, hitTestData);
		ctx.restore();
	}

	public drawBackground(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean, hitTestData?: unknown): void {
		ctx.save();
		if (Math.abs(pixelRatio - 1) > 0.01) {
			ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		}
		this._drawBackgroundImpl(ctx, isHovered, hitTestData);
		ctx.restore();
	}

	protected abstract _drawImpl(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void;

	protected _drawBackgroundImpl(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void {
	}
}
