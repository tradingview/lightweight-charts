import { CanvasRenderingTarget } from './canvas-rendering-target';
import { IPaneRenderer } from './ipane-renderer';

export class CompositeRenderer implements IPaneRenderer {
	private _renderers: readonly IPaneRenderer[] = [];

	public setRenderers(renderers: readonly IPaneRenderer[]): void {
		this._renderers = renderers;
	}

	public draw(target: CanvasRenderingTarget, isHovered: boolean, hitTestData?: unknown): void {
		this._renderers.forEach((r: IPaneRenderer) => {
			target.context.save();
			r.draw(target, isHovered, hitTestData);
			target.context.restore();
		});
	}
}
