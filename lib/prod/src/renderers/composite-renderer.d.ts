import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { IPaneRenderer } from './ipane-renderer';
export declare class CompositeRenderer implements IPaneRenderer {
    private _renderers;
    setRenderers(renderers: readonly IPaneRenderer[]): void;
    draw(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void;
}
