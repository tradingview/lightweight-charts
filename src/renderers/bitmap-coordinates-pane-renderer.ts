import { BitmapCoordsRenderingScope, CanvasRenderingTarget } from './canvas-rendering-target';
import { IPaneRenderer } from './ipane-renderer';

export abstract class BitmapCoordinatesPaneRenderer implements IPaneRenderer {
	public draw(target: CanvasRenderingTarget, isHovered: boolean, hitTestData?: unknown): void {
		target.useBitmapCoordinates(
			(scope: BitmapCoordsRenderingScope) => this._drawImpl(scope, isHovered, hitTestData)
		);
	}

	// public drawBackground(target: CanvasRenderingTarget, isHovered: boolean, hitTestData?: unknown): void {
	// 	target.useBitmapCoordinates(
	// 		(scope: BitmapCoordsRenderingScope) => this._drawBackgroundImpl(scope, isHovered, hitTestData)
	// 	);
	// }

	protected abstract _drawImpl(renderingScope: BitmapCoordsRenderingScope, isHovered: boolean, hitTestData?: unknown): void;

	// protected _drawBackgroundImpl(renderingScope: BitmapCoordsRenderingScope, isHovered: boolean, hitTestData?: unknown): void {}
}
