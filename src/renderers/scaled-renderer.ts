import { CanvasRenderingTarget, MediaCoordsRenderingScope } from './canvas-rendering-target';
import { IPaneRenderer } from './ipane-renderer';

export abstract class ScaledRenderer implements IPaneRenderer {
	public draw(target: CanvasRenderingTarget, isHovered: boolean, hitTestData?: unknown): void {
		target.useMediaCoordinates(
			(scope: MediaCoordsRenderingScope) => this._drawImpl(scope, isHovered, hitTestData)
		);
	}

	public drawBackground(target: CanvasRenderingTarget, isHovered: boolean, hitTestData?: unknown): void {
		target.useMediaCoordinates(
			(scope: MediaCoordsRenderingScope) => this._drawBackgroundImpl(scope, isHovered, hitTestData)
		);
	}

	protected abstract _drawImpl(renderingScope: MediaCoordsRenderingScope, isHovered: boolean, hitTestData?: unknown): void;

	protected _drawBackgroundImpl(renderingScope: MediaCoordsRenderingScope, isHovered: boolean, hitTestData?: unknown): void {}
}
