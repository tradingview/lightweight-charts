import { IPaneRenderer } from './ipane-renderer';
import { CanvasRenderingParams } from './render-params';

export class CompositeRenderer implements IPaneRenderer {
	private _renderers: readonly IPaneRenderer[] = [];

	public setRenderers(renderers: readonly IPaneRenderer[]): void {
		this._renderers = renderers;
	}

	public draw(ctx: CanvasRenderingContext2D, renderParams: CanvasRenderingParams, isHovered: boolean, hitTestData?: unknown): void {
		this._renderers.forEach((r: IPaneRenderer) => {
			ctx.save();
			r.draw(ctx, renderParams, isHovered, hitTestData);
			ctx.restore();
		});
	}
}
