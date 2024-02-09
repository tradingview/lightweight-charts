"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hitTestArrow = exports.drawArrow = void 0;
const mathex_1 = require("../helpers/mathex");
const series_markers_square_1 = require("./series-markers-square");
const series_markers_utils_1 = require("./series-markers-utils");
function drawArrow(up, ctx, coords, size) {
    const arrowSize = (0, series_markers_utils_1.shapeSize)('arrowUp', size);
    const halfArrowSize = ((arrowSize - 1) / 2) * coords.pixelRatio;
    const baseSize = (0, mathex_1.ceiledOdd)(size / 2);
    const halfBaseSize = ((baseSize - 1) / 2) * coords.pixelRatio;
    ctx.beginPath();
    if (up) {
        ctx.moveTo(coords.x - halfArrowSize, coords.y);
        ctx.lineTo(coords.x, coords.y - halfArrowSize);
        ctx.lineTo(coords.x + halfArrowSize, coords.y);
        ctx.lineTo(coords.x + halfBaseSize, coords.y);
        ctx.lineTo(coords.x + halfBaseSize, coords.y + halfArrowSize);
        ctx.lineTo(coords.x - halfBaseSize, coords.y + halfArrowSize);
        ctx.lineTo(coords.x - halfBaseSize, coords.y);
    }
    else {
        ctx.moveTo(coords.x - halfArrowSize, coords.y);
        ctx.lineTo(coords.x, coords.y + halfArrowSize);
        ctx.lineTo(coords.x + halfArrowSize, coords.y);
        ctx.lineTo(coords.x + halfBaseSize, coords.y);
        ctx.lineTo(coords.x + halfBaseSize, coords.y - halfArrowSize);
        ctx.lineTo(coords.x - halfBaseSize, coords.y - halfArrowSize);
        ctx.lineTo(coords.x - halfBaseSize, coords.y);
    }
    ctx.fill();
}
exports.drawArrow = drawArrow;
function hitTestArrow(up, centerX, centerY, size, x, y) {
    // TODO: implement arrow hit test
    return (0, series_markers_square_1.hitTestSquare)(centerX, centerY, size, x, y);
}
exports.hitTestArrow = hitTestArrow;
