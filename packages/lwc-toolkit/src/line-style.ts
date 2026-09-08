/**
 * The line styles the chart itself draws, by their numeric values. The values
 * match `LineStyle` in `lightweight-charts`, so an option typed with the
 * library's enum can be passed straight to {@link setLineStyle}.
 */
export const LineStyle = {
	/** A solid line. */
	Solid: 0,
	/** A dotted line. */
	Dotted: 1,
	/** A dashed line. */
	Dashed: 2,
	/** A dashed line with bigger dashes. */
	LargeDashed: 3,
	/** A dotted line with more space between dots. */
	SparseDotted: 4,
} as const;

/** One of the {@link LineStyle} values. */
export type LineStyle = (typeof LineStyle)[keyof typeof LineStyle];

/**
 * The dash pattern the chart uses for a line style, as multiples of
 * `lineWidth`: the array to hand to `CanvasRenderingContext2D.setLineDash`.
 * An unknown style, and `Solid`, give an empty pattern (a solid line).
 *
 * @param style - line style to draw
 * @param lineWidth - width of the line, in the units of the coordinate space being drawn in
 */
export function getDashPattern(style: LineStyle, lineWidth: number): number[] {
	switch (style) {
		case LineStyle.Solid:
			return [];
		case LineStyle.Dotted:
			return [lineWidth, lineWidth];
		case LineStyle.Dashed:
			return [2 * lineWidth, 2 * lineWidth];
		case LineStyle.LargeDashed:
			return [6 * lineWidth, 6 * lineWidth];
		case LineStyle.SparseDotted:
			return [lineWidth, 4 * lineWidth];
		default:
			return [];
	}
}

/**
 * Applies a line style to a canvas context, the way the chart's own lines are
 * dashed. Set `ctx.lineWidth` first: the dash lengths are multiples of it.
 *
 * `pixelRatio` scales the pattern for the coordinate space being drawn in. Its
 * default of `1` is right whenever `ctx.lineWidth` is already in the units of
 * that space — including the usual bitmap-space renderer, which sets
 * `ctx.lineWidth = width * verticalPixelRatio`. Pass the pixel ratio only when
 * drawing in bitmap coordinates with `ctx.lineWidth` left in media units.
 *
 * @returns the dash pattern which was applied
 */
export function setLineStyle(
	ctx: CanvasRenderingContext2D,
	style: LineStyle,
	pixelRatio: number = 1
): number[] {
	const dashPattern = getDashPattern(style, ctx.lineWidth * pixelRatio);
	ctx.setLineDash(dashPattern);
	return dashPattern;
}
