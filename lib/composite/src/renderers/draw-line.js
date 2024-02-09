"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strokeInPixel = exports.drawVerticalLine = exports.drawHorizontalLine = exports.setLineStyle = exports.LineStyle = exports.LineType = void 0;
/**
 * Represents the possible line types.
 */
var LineType;
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
})(LineType = exports.LineType || (exports.LineType = {}));
/**
 * Represents the possible line styles.
 */
var LineStyle;
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
})(LineStyle = exports.LineStyle || (exports.LineStyle = {}));
function setLineStyle(ctx, style) {
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
exports.setLineStyle = setLineStyle;
function drawHorizontalLine(ctx, y, left, right) {
    ctx.beginPath();
    const correction = (ctx.lineWidth % 2) ? 0.5 : 0;
    ctx.moveTo(left, y + correction);
    ctx.lineTo(right, y + correction);
    ctx.stroke();
}
exports.drawHorizontalLine = drawHorizontalLine;
function drawVerticalLine(ctx, x, top, bottom) {
    ctx.beginPath();
    const correction = (ctx.lineWidth % 2) ? 0.5 : 0;
    ctx.moveTo(x + correction, top);
    ctx.lineTo(x + correction, bottom);
    ctx.stroke();
}
exports.drawVerticalLine = drawVerticalLine;
function strokeInPixel(ctx, drawFunction) {
    ctx.save();
    if (ctx.lineWidth % 2) {
        ctx.translate(0.5, 0.5);
    }
    drawFunction();
    ctx.restore();
}
exports.strokeInPixel = strokeInPixel;
