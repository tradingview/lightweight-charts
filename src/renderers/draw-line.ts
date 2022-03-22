import { Coordinate } from '../model/coordinate';

/**
 * Represents the width of a line.
 */
export type LineWidth = 1 | 2 | 3 | 4;

/**
 * Represents the possible line types.
 */
export const enum LineType {
	/**
	 * A line.
	 */
	Simple,
	/**
	 * A stepped line.
	 */
	WithSteps,
	/**
	 * A curved line.
	 */
	Curved,
}

/**
 * A point on a line.
 */
export interface LinePoint {
	/**
	 * The point's x coordinate.
	 */
	x: Coordinate;
	/**
	 * The point's y coordinate.
	 */
	y: Coordinate;
}

/**
 * Represents the possible line styles.
 */
export const enum LineStyle {
	/**
	 * A solid line.
	 */
	Solid = 0,
	/**
	 * A dotted line.
	 */
	Dotted = 1,
	/**
	 * A dashed line.
	 */
	Dashed = 2,
	/**
	 * A dashed line with bigger dashes.
	 */
	LargeDashed = 3,
	/**
	 * A dottled line with more space between dots.
	 */
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
