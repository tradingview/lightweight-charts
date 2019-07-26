import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';

export interface IPaneRenderer {
	draw(ctx: CanvasRenderingContext2D, isHovered: boolean, objectId?: string): void;
	drawBackground?(ctx: CanvasRenderingContext2D, isHovered: boolean, objectId?: string): void;
	hitTest?(x: Coordinate, y: Coordinate): HoveredObject | null;
}
