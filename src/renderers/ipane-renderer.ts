import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';

import { CanvasRenderingParams } from './canvas-rendering-target';

export interface IPaneRenderer {
	draw(ctx: CanvasRenderingContext2D, renderParams: CanvasRenderingParams, isHovered: boolean, hitTestData?: unknown): void;
	drawBackground?(ctx: CanvasRenderingContext2D, renderParams: CanvasRenderingParams, isHovered: boolean, hitTestData?: unknown): void;
	hitTest?(x: Coordinate, y: Coordinate): HoveredObject | null;
}
