import { CanvasRenderingTarget2D, MediaCoordinatesRenderingScope } from 'fancy-canvas';
import { IPaneRenderer } from './ipane-renderer';
export declare abstract class MediaCoordinatesPaneRenderer implements IPaneRenderer {
    draw(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void;
    drawBackground(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void;
    protected abstract _drawImpl(renderingScope: MediaCoordinatesRenderingScope, isHovered: boolean, hitTestData?: unknown): void;
    protected _drawBackgroundImpl(renderingScope: MediaCoordinatesRenderingScope, isHovered: boolean, hitTestData?: unknown): void;
}
