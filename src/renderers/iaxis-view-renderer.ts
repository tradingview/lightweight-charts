import { CanvasRenderingTarget2D } from 'fancy-canvas';

export interface IAxisRenderer {
	draw(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void;
	drawBackground?(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void;
}
