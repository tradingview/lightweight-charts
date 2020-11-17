import { Coordinate } from '../model/coordinate';

export type LineWidth = 1 | 2 | 3 | 4;

export const enum LineType {
	Simple,
	WithSteps,
}

export interface LinePoint {
	x: Coordinate;
	y: Coordinate;
}

export const enum LineStyle {
	Solid = 0,
	Dotted = 1,
	Dashed = 2,
	LargeDashed = 3,
	SparseDotted = 4,
}

export function setLineStyle(ctx: CanvasRenderingContext2D, style: LineStyle): void {
	const dashPatterns = {
		[LineStyle.Solid]: [],
		[LineStyle.Dotted]: [ctx.lineWidth, ctx.lineWidth],
		[LineStyle.Dashed]: [2 * ctx.lineWidth, 2 * ctx.lineWidth],
		[LineStyle.LargeDashed]: [6 * ctx.lineWidth, 6 * ctx.lineWidth],
		[LineStyle.SparseDotted]: [ctx.lineWidth, 4 * ctx.lineWidth],
	};

	const dashPattern = dashPatterns[style];
	ctx.setLineDash(dashPattern);
}

export function drawHorizontalLine(ctx: CanvasRenderingContext2D, y: number, left: number, right: number): void {
	ctx.beginPath();
	const correction = (ctx.lineWidth % 2) ? 0.5 : 0;
	ctx.moveTo(left, y + correction);
	ctx.lineTo(right, y + correction);
	ctx.stroke();
}

export function drawVerticalLine(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number): void {
	ctx.beginPath();
	const correction = (ctx.lineWidth % 2) ? 0.5 : 0;
	ctx.moveTo(x + correction, top);
	ctx.lineTo(x + correction, bottom);
	ctx.stroke();
}

export function strokeInPixel(ctx: CanvasRenderingContext2D, drawFunction: () => void): void {
	ctx.save();
	if (ctx.lineWidth % 2) {
		ctx.translate(0.5, 0.5);
	}
	drawFunction();
	ctx.restore();
}
