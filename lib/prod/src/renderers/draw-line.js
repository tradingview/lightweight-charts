/**
 * Represents the possible line types.
 */
export var LineType;
(function (LineType) {
    /**
     * A line.
     */
    LineType[LineType["Simple"] = 0] = "Simple";
    /**
     * A stepped line.
     */
    LineType[LineType["WithSteps"] = 1] = "WithSteps";
    /**
     * A curved line.
     */
    LineType[LineType["Curved"] = 2] = "Curved";
})(LineType || (LineType = {}));
/**
 * Represents the possible line styles.
 */
export var LineStyle;
(function (LineStyle) {
    /**
     * A solid line.
     */
    LineStyle[LineStyle["Solid"] = 0] = "Solid";
    /**
     * A dotted line.
     */
    LineStyle[LineStyle["Dotted"] = 1] = "Dotted";
    /**
     * A dashed line.
     */
    LineStyle[LineStyle["Dashed"] = 2] = "Dashed";
    /**
     * A dashed line with bigger dashes.
     */
    LineStyle[LineStyle["LargeDashed"] = 3] = "LargeDashed";
    /**
     * A dotted line with more space between dots.
     */
    LineStyle[LineStyle["SparseDotted"] = 4] = "SparseDotted";
})(LineStyle || (LineStyle = {}));
export function setLineStyle(ctx, style) {
    const dashPatterns = {
        [0 /* LineStyle.Solid */]: [],
        [1 /* LineStyle.Dotted */]: [ctx.lineWidth, ctx.lineWidth],
        [2 /* LineStyle.Dashed */]: [2 * ctx.lineWidth, 2 * ctx.lineWidth],
        [3 /* LineStyle.LargeDashed */]: [6 * ctx.lineWidth, 6 * ctx.lineWidth],
        [4 /* LineStyle.SparseDotted */]: [ctx.lineWidth, 4 * ctx.lineWidth],
    };
    const dashPattern = dashPatterns[style];
    ctx.setLineDash(dashPattern);
}
export function drawHorizontalLine(ctx, y, left, right) {
    ctx.beginPath();
    const correction = (ctx.lineWidth % 2) ? 0.5 : 0;
    ctx.moveTo(left, y + correction);
    ctx.lineTo(right, y + correction);
    ctx.stroke();
}
export function drawVerticalLine(ctx, x, top, bottom) {
    ctx.beginPath();
    const correction = (ctx.lineWidth % 2) ? 0.5 : 0;
    ctx.moveTo(x + correction, top);
    ctx.lineTo(x + correction, bottom);
    ctx.stroke();
}
export function strokeInPixel(ctx, drawFunction) {
    ctx.save();
    if (ctx.lineWidth % 2) {
        ctx.translate(0.5, 0.5);
    }
    drawFunction();
    ctx.restore();
}
