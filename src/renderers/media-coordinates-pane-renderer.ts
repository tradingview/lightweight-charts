import { CanvasRenderingTarget2D, MediaCoordinatesRenderingScope } from 'fancy-canvas';

import { IPaneRenderer } from './ipane-renderer';

export abstract class MediaCoordinatesPaneRenderer implements IPaneRenderer {
	public draw(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void {
		target.useMediaCoordinateSpace(
			(scope: MediaCoordinatesRenderingScope) => this._drawImpl(scope, isHovered, hitTestData)
		);
	}

	public drawBackground(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void {
		target.useMediaCoordinateSpace(
			(scope: MediaCoordinatesRenderingScope) => this._drawBackgroundImpl(scope, isHovered, hitTestData)
		);
	}

	protected abstract _drawImpl(renderingScope: MediaCoordinatesRenderingScope, isHovered: boolean, hitTestData?: unknown): void;

	protected _drawBackgroundImpl(renderingScope: MediaCoordinatesRenderingScope, isHovered: boolean, hitTestData?: unknown): void {}
}
