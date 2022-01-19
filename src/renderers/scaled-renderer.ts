import { CanvasRenderingTarget } from './canvas-rendering-target';
import { IPaneRenderer } from './ipane-renderer';

export abstract class ScaledRenderer implements IPaneRenderer {
	public draw(target: CanvasRenderingTarget, isHovered: boolean, hitTestData?: unknown): void {
		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = target;
		ctx.save();
		// actually we must be sure that this scaling applied only once at the same time
		// currently ScaledRenderer could be only nodes renderer (not top-level renderers like CompositeRenderer or something)
		// so this "constraint" is fulfilled for now
		ctx.scale(horizontalPixelRatio, verticalPixelRatio);
		this._drawImpl(ctx, isHovered, hitTestData);
		ctx.restore();
	}

	public drawBackground(target: CanvasRenderingTarget, isHovered: boolean, hitTestData?: unknown): void {
		const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = target;
		ctx.save();
		// actually we must be sure that this scaling applied only once at the same time
		// currently ScaledRenderer could be only nodes renderer (not top-level renderers like CompositeRenderer or something)
		// so this "constraint" is fulfilled for now
		ctx.scale(horizontalPixelRatio, verticalPixelRatio);
		this._drawBackgroundImpl(ctx, isHovered, hitTestData);
		ctx.restore();
	}

	protected abstract _drawImpl(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void;

	protected _drawBackgroundImpl(ctx: CanvasRenderingContext2D, isHovered: boolean, hitTestData?: unknown): void {}
}
