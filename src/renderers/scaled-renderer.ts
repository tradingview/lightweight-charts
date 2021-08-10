import { IPaneRenderer } from './ipane-renderer';
import { CanvasRenderingParams } from './render-params';

export abstract class ScaledRenderer implements IPaneRenderer {
	public draw(ctx: CanvasRenderingContext2D, renderParams: CanvasRenderingParams, isHovered: boolean, hitTestData?: unknown): void {
		ctx.save();
		// actually we must be sure that this scaling applied only once at the same time
		// currently ScaledRenderer could be only nodes renderer (not top-level renderers like CompositeRenderer or something)
		// so this "constraint" is fulfilled for now
		const { horizontalPixelRatio, verticalPixelRatio } = renderParams;
		ctx.scale(horizontalPixelRatio, verticalPixelRatio);
		this._drawImpl(ctx, isHovered, hitTestData);
		ctx.restore();
	}

	public drawBackground(ctx: CanvasRenderingContext2D, renderParams: CanvasRenderingParams, isHovered: boolean, hitTestData?: unknown): void {
		ctx.save();
		// actually we must be sure that this scaling applied only once at the same time
		// currently ScaledRenderer could be only nodes renderer (not top-level renderers like CompositeRenderer or something)
		// so this "constraint" is fulfilled for now
		const { horizontalPixelRatio, verticalPixelRatio } = renderParams;
		ctx.scale(horizontalPixelRatio, verticalPixelRatio);
		this._drawBackgroundImpl(ctx, isHovered, hitTestData);
		ctx.restore();
	}

	protected abstract _drawImpl(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void;

	protected _drawBackgroundImpl(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void {}
}
