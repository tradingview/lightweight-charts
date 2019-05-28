import { Coordinate } from '../model/coordinate';

export interface IPaneRenderer {
	draw(ctx: CanvasRenderingContext2D, isHovered: boolean): void;
	drawBackground?(ctx: CanvasRenderingContext2D, isHovered: boolean): void;
	hitTest?(x: Coordinate, y: Coordinate): boolean;
}
