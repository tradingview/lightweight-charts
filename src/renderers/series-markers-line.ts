import { drawVerticalLine, LineStyle, setLineStyle } from './draw-line';

export function drawLine(
	ctx: CanvasRenderingContext2D,
	x: number,
	lineStyle: LineStyle,
	height: number
): void {
	setLineStyle(ctx, lineStyle);
	drawVerticalLine(ctx, x, 0, height - 20);
}

export function hitTestLine(centerX: number, x: number): boolean {
	return centerX === x;
}
