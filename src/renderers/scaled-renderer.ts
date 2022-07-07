import { CanvasElementCoordsRenderingScope, CanvasRenderingTarget } from './canvas-rendering-target';
import { IPaneRenderer } from './ipane-renderer';

export abstract class ScaledRenderer implements IPaneRenderer {
	public draw(target: CanvasRenderingTarget, isHovered: boolean, hitTestData?: unknown): void {
		target.useCanvasElementCoordinates(
			(scope: CanvasElementCoordsRenderingScope) => this._drawImpl(scope, isHovered, hitTestData)
		);
	}

	public drawBackground(target: CanvasRenderingTarget, isHovered: boolean, hitTestData?: unknown): void {
		target.useCanvasElementCoordinates(
			(scope: CanvasElementCoordsRenderingScope) => this._drawBackgroundImpl(scope, isHovered, hitTestData)
		);
	}

	protected abstract _drawImpl(renderingScope: CanvasElementCoordsRenderingScope, isHovered: boolean, hitTestData?: unknown): void;

	protected _drawBackgroundImpl(renderingScope: CanvasElementCoordsRenderingScope, isHovered: boolean, hitTestData?: unknown): void {}
}
