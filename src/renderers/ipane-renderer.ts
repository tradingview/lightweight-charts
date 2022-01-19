import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';

import { CanvasRenderingTarget } from './canvas-rendering-target';

export interface IPaneRenderer {
	draw(target: CanvasRenderingTarget, isHovered: boolean, hitTestData?: unknown): void;
	drawBackground?(target: CanvasRenderingTarget, isHovered: boolean, hitTestData?: unknown): void;
	hitTest?(x: Coordinate, y: Coordinate): HoveredObject | null;
}
