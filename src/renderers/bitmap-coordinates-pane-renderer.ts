import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';

import { IPaneRenderer } from './ipane-renderer';

export abstract class BitmapCoordinatesPaneRenderer implements IPaneRenderer {
	public draw(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void {
		target.useBitmapCoordinateSpace(
			(scope: BitmapCoordinatesRenderingScope) => this._drawImpl(scope, isHovered, hitTestData)
		);
	}

	// public drawBackground(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void {
	// 	target.useBitmapCoordinateSpace(
	// 		(scope: BitmapCoordinatesRenderingScope) => this._drawBackgroundImpl(scope, isHovered, hitTestData)
	// 	);
	// }

	protected abstract _drawImpl(renderingScope: BitmapCoordinatesRenderingScope, isHovered: boolean, hitTestData?: unknown): void;

	// protected _drawBackgroundImpl(renderingScope: BitmapCoordsRenderingScope, isHovered: boolean, hitTestData?: unknown): void {}
}
