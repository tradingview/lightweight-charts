import { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from 'fancy-canvas';
import { IPaneRenderer } from './ipane-renderer';
export declare abstract class BitmapCoordinatesPaneRenderer implements IPaneRenderer {
    draw(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void;
    protected abstract _drawImpl(renderingScope: BitmapCoordinatesRenderingScope, isHovered: boolean, hitTestData?: unknown): void;
}
